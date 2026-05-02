from __future__ import annotations

import asyncio
import json
import re
import threading
import time
from pathlib import Path
from typing import Literal

import os

from fastapi import FastAPI, HTTPException
from openai import OpenAI
from pydantic import BaseModel

from normalize_text import normalize
from rules import classify_with_rules

_APP_DIR = Path(__file__).resolve().parent
_REPO_ROOT = _APP_DIR.parent.parent
_AGENT_PROMPTS_PATH = _APP_DIR / "agent_prompts"


def _load_dotenv_files(*paths: Path) -> None:
    """Populate os.environ from KEY=VALUE lines; does not override existing vars."""
    for path in paths:
        if not path.is_file():
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except OSError:
            continue
        for raw in text.splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            key = key.strip()
            if not key or key in os.environ:
                continue
            val = val.strip()
            if len(val) >= 2 and val[0] == val[-1] and val[0] in "\"'":
                val = val[1:-1]
            os.environ[key] = val


_load_dotenv_files(
    _REPO_ROOT / ".env.local",
    _REPO_ROOT / ".env",
    _APP_DIR / ".env.local",
    _APP_DIR / ".env",
)

app = FastAPI()

_cache_lock = threading.Lock()
# cache key = normalize(desc) + amount (see _cache_key); value = (category, source, monotonic_ts); disabled when TTL <= 0
_rule_cache: dict[str, tuple[str, Literal["rules", "llm"], float]] = {}


def _cache_ttl_sec() -> float:
    return float(os.getenv("CLASSIFIER_RULE_CACHE_TTL_SEC", "86400"))


def _cache_key(norm_description: str, amount: float) -> str:
    """Include amount so fuel rules and LLM amount hints cannot cross-contaminate."""
    return f"{norm_description}\x1f{amount!r}"


def _cache_get(norm_description: str, amount: float) -> tuple[str, Literal["rules", "llm"]] | None:
    ttl = _cache_ttl_sec()
    if ttl <= 0:
        return None
    now = time.monotonic()
    key = _cache_key(norm_description, amount)
    with _cache_lock:
        entry = _rule_cache.get(key)
        if not entry:
            return None
        category, source, ts = entry
        if now - ts > ttl:
            del _rule_cache[key]
            return None
        return category, source


def _cache_put(
    norm_description: str,
    amount: float,
    category: str,
    source: Literal["rules", "llm"],
) -> None:
    if _cache_ttl_sec() <= 0:
        return
    key = _cache_key(norm_description, amount)
    with _cache_lock:
        _rule_cache[key] = (category, source, time.monotonic())


_unmatched_lock = threading.Lock()


def _unmatched_log_path() -> Path:
    raw = (os.getenv("CLASSIFIER_UNMATCHED_LOG") or "").strip()
    return Path(raw) if raw else _APP_DIR / "unmatched_transactions.jsonl"


def log_unmatched_transaction(description: str, amount: float) -> None:
    path = _unmatched_log_path()
    line = json.dumps({"description": description, "amount": amount}, ensure_ascii=False) + "\n"
    with _unmatched_lock:
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("a", encoding="utf-8") as f:
            f.write(line)


def _openrouter_api_key() -> str | None:
    return os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENROUTER_LLM_API")


def _openrouter_base_url() -> str:
    return os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1").rstrip("/")


def _openrouter_model() -> str:
    # `*:free` models only work when OpenRouter has an active free provider; otherwise you get 404
    # "No endpoints found". Use the non-`:free` id for the normal (metered) route.
    return os.getenv("OPENROUTER_MODEL", "deepseek/deepseek-v4-flash")


def _openrouter_default_headers() -> dict[str, str] | None:
    """Optional OpenRouter attribution headers (https://openrouter.ai/docs)."""
    referer = (os.getenv("OPENROUTER_HTTP_REFERER") or "").strip()
    title = (os.getenv("OPENROUTER_APP_TITLE") or "").strip()
    if not referer and not title:
        return None
    h: dict[str, str] = {}
    if referer:
        h["HTTP-Referer"] = referer
    if title:
        h["X-Title"] = title
    return h or None


def _load_agent_prompt_template() -> str:
    try:
        return _AGENT_PROMPTS_PATH.read_text(encoding="utf-8")
    except OSError as e:
        raise RuntimeError(f"Cannot read agent prompts at {_AGENT_PROMPTS_PATH}") from e


def _allowed_categories_from_template(template: str) -> list[str]:
    # Legacy phrase from older prompts
    m = re.search(
        r"Allowed slug list \(exactly one token from this comma-separated list\):\s*(.+?)(?:\n\n|\nTransaction|$)",
        template,
        re.DOTALL | re.IGNORECASE,
    )
    if not m:
        # Current agent_prompts: "**Allowed Slug List:**" then a comma-separated line
        m = re.search(r"(?im)^\*\*Allowed Slug List:\*\*\s*\n\s*(.+)$", template)
    if not m:
        raise ValueError("agent_prompts missing Allowed slug list block")
    return [s.strip().lower() for s in m.group(1).strip().split(",") if s.strip()]


class TransactionIn(BaseModel):
    """Single uncategorized row; `description` is the bank/card line sent to the LLM."""

    description: str
    amount: float

class ClassifyRequest(BaseModel):
    transactions: list[TransactionIn]


class CategorizedTransaction(BaseModel):
    description: str
    amount: float
    category: str
    source: Literal["rules", "llm"]


class ClassifyResponse(BaseModel):
    transactions: list[CategorizedTransaction]


def _render_prompt(template: str, *, description: str, amount: float, currency: str) -> str:
    return (
        template.replace("{description}", description.strip())
        .replace("{amount}", f"{amount:.2f}")
        .replace("{currency}", currency)
    )


async def classify_with_llm(
    description: str,
    amount: float,
    template: str,
    allowed: list[str],
    *,
    currency: str = "GBP",
) -> str:
    return await asyncio.to_thread(
        llm_classify,
        description,
        amount,
        template,
        allowed,
        currency=currency,
    )


def llm_classify(
    description: str,
    amount: float,
    template: str,
    allowed: list[str],
    *,
    currency: str = "GBP",
) -> str:
    key = _openrouter_api_key()
    if not key:
        raise HTTPException(
            status_code=503,
            detail="OpenRouter API key missing: set OPENROUTER_API_KEY "
            "(e.g. in .env.local at repo root).",
        )
    headers = _openrouter_default_headers()
    client = OpenAI(
        api_key=key,
        base_url=_openrouter_base_url(),
        **({"default_headers": headers} if headers else {}),
    )
    user_content = _render_prompt(template, description=description, amount=amount, currency=currency)
    msg = client.chat.completions.create(
        model=_openrouter_model(),
        max_tokens=40,
        messages=[{"role": "user", "content": user_content}],
    )
    result = (msg.choices[0].message.content or "").strip().lower()
    if result not in allowed:
        fallback = "uncatergorise" if "uncatergorise" in allowed else "uncategorised"
        if fallback not in allowed:
            return allowed[-1]
        return fallback
    return result


async def classify_transaction(
    description: str,
    amount: float,
    *,
    template: str,
    allowed: list[str],
    currency: str = "GBP",
) -> CategorizedTransaction:
    line = description.strip()
    norm = normalize(line)
    cached = _cache_get(norm, amount)
    if cached:
        category, source = cached
        return CategorizedTransaction(
            description=description,
            amount=amount,
            category=category,
            source=source,
        )

    rule_result = classify_with_rules(line, amount)
    if rule_result:
        _cache_put(norm, amount, rule_result, "rules")
        return CategorizedTransaction(
            description=description,
            amount=amount,
            category=rule_result,
            source="rules",
        )

    log_unmatched_transaction(description, amount)
    llm_result = await classify_with_llm(line, amount, template, allowed, currency=currency)
    _cache_put(norm, amount, llm_result, "llm")
    return CategorizedTransaction(
        description=description,
        amount=amount,
        category=llm_result,
        source="llm",
    )


@app.post("/classify", response_model=ClassifyResponse)
async def classify_transactions(body: ClassifyRequest):
    if not body.transactions:
        raise HTTPException(status_code=400, detail="transactions must not be empty")

    template = _load_agent_prompt_template()
    allowed = _allowed_categories_from_template(template)

    out: list[CategorizedTransaction] = []
    for t in body.transactions:
        line = t.description.strip()
        if not line:
            raise HTTPException(
                status_code=400,
                detail="Each transaction needs a non-empty description",
            )

        categorized = await classify_transaction(
            t.description,
            t.amount,
            template=template,
            allowed=allowed,
        )
        out.append(categorized)

    return ClassifyResponse(transactions=out)


@app.post("/classify-one", response_model=CategorizedTransaction)
async def classify_one_transaction(body: TransactionIn):
    line = body.description.strip()
    if not line:
        raise HTTPException(
            status_code=400,
            detail="Transaction needs a non-empty description",
        )

    template = _load_agent_prompt_template()
    allowed = _allowed_categories_from_template(template)

    return await classify_transaction(
        body.description,
        body.amount,
        template=template,
        allowed=allowed,
    )


if __name__ == "__main__":
    import uvicorn

    # 0.0.0.0 = listen on all interfaces so other machines can use http://<this-host-LAN-IP>:port
    host = os.getenv("CLASSIFIER_HOST", "0.0.0.0")
    port = int(os.getenv("CLASSIFIER_PORT", "8000"))
    uvicorn.run("main_classifier:app", host=host, port=port, reload=True)

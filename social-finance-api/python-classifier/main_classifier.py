import re
import csv
import io
import sqlite3
import anthropic

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel

# ── Constants ─────────────────────────────────────────────────────────────

ALL_CATEGORIES = [
    "eating_out",
    "groceries",
    "clothing",
    "transport",
    "rent",
    "subscriptions",
    "entertainment",
    "other"
]

SEED_MERCHANTS = [
    ("mcdonalds", "eating_out"),
    ("kfc", "eating_out"),
    ("uber eats", "eating_out"),
    ("doordash", "eating_out"),
    ("subway", "eating_out"),
    ("burger king", "eating_out"),
    ("nandos", "eating_out"),

    ("countdown", "groceries"),
    ("paknsave", "groceries"),
    ("new world", "groceries"),
    ("fresh choice", "groceries"),
    ("the warehouse", "groceries"),

    ("uber", "transport"),
    ("ola", "transport"),
    ("at hop", "transport"),
    ("z energy", "transport"),
    ("bp", "transport"),
    ("caltex", "transport"),

    ("zara", "clothing"),
    ("cotton on", "clothing"),
    ("glassons", "clothing"),
    ("h&m", "clothing"),
    ("asos", "clothing"),

    ("netflix", "subscriptions"),
    ("spotify", "subscriptions"),
    ("apple", "subscriptions"),
    ("google", "subscriptions"),

    ("steam", "entertainment"),
    ("ticketek", "entertainment"),
    ("sky sport", "entertainment"),
]

# ── Database ──────────────────────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect("classifier.db")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    db = get_db()

    db.execute("""
        CREATE TABLE IF NOT EXISTS merchant_cache (
            merchant    TEXT PRIMARY KEY,
            category    TEXT NOT NULL,
            method      TEXT NOT NULL DEFAULT 'seed',
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    db.executemany("""
        INSERT OR IGNORE INTO merchant_cache
        (merchant, category, method)
        VALUES (?, ?, 'seed')
    """, SEED_MERCHANTS)

    db.commit()
    db.close()

# ── Lifespan ──────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(lifespan=lifespan)

# ── Schemas ───────────────────────────────────────────────────────────────

class TransactionRequest(BaseModel):
    description: str
    amount: float
    bad_categories: list[str]

class ClassificationResult(BaseModel):
    category: str
    method: str
    is_bad_spend: bool
    needs_review: bool

class CacheOverride(BaseModel):
    merchant: str
    category: str

# ── Merchant Extraction ───────────────────────────────────────────────────

def extract_merchant(description: str) -> str:
    """
    Minimal cleaning only.
    """

    cleaned = description.lower()

    # remove large numeric IDs
    cleaned = re.sub(r'\b\d{4,}\b', '', cleaned)

    # collapse whitespace
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()

    return cleaned

# ── Cache Lookup ──────────────────────────────────────────────────────────

def cache_lookup(merchant: str, db) -> str | None:
    """
    Fuzzy keyword matching.

    Example:
    "mcdonalds queen street auckland"
    matches:
    "mcdonalds"
    """

    rows = db.execute("""
        SELECT merchant, category
        FROM merchant_cache
    """).fetchall()

    merchant = merchant.lower()

    for row in rows:

        cached = row["merchant"].lower()

        # exact match
        if cached == merchant:
            return row["category"]

        # keyword match
        if cached in merchant:
            return row["category"]

    return None

# ── LLM Classification ────────────────────────────────────────────────────

def llm_classify(description: str) -> str:

    client = anthropic.Anthropic()

    cat_list = ", ".join(ALL_CATEGORIES)

    msg = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=20,
        messages=[{
            "role": "user",
            "content": (
                f"Classify this bank transaction into exactly one of: {cat_list}.\n"
                f"Transaction: '{description}'\n"
                f"Reply with only the category name."
            )
        }]
    )

    result = msg.content[0].text.strip().lower()

    if result not in ALL_CATEGORIES:
        return "other"

    return result

# ── Main Classification Logic ─────────────────────────────────────────────

def classify(description: str, db) -> dict:

    merchant = extract_merchant(description)

    # try cache first
    category = cache_lookup(merchant, db)

    if category:
        return {
            "category": category,
            "method": "cache",
            "needs_review": False
        }

    # fallback to LLM
    category = llm_classify(description)

    # save learned merchant
    db.execute("""
        INSERT OR REPLACE INTO merchant_cache
        (merchant, category, method)
        VALUES (?, ?, 'llm')
    """, (merchant, category))

    db.commit()

    return {
        "category": category,
        "method": "llm",
        "needs_review": True
    }

# ── Single Transaction Route ──────────────────────────────────────────────

@app.post("/classify", response_model=ClassificationResult)
def classify_transaction(req: TransactionRequest):

    db = get_db()

    try:

        result = classify(req.description, db)

        return ClassificationResult(
            **result,
            is_bad_spend=result["category"] in req.bad_categories
        )

    finally:
        db.close()

# ── CSV Upload Route ──────────────────────────────────────────────────────

@app.post("/classify-csv")
async def classify_csv(
    file: UploadFile = File(...),
    bad_categories: str = ""
):

    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="File must be a CSV"
        )

    contents = await file.read()

    try:
        text = contents.decode("utf-8")

    except:
        raise HTTPException(
            status_code=400,
            detail="Could not decode CSV"
        )

    reader = csv.DictReader(io.StringIO(text))

    db = get_db()

    results = []

    bad_set = {
        x.strip().lower()
        for x in bad_categories.split(",")
        if x.strip()
    }

    try:

        for row in reader:

            description = row.get("description", "")
            amount = row.get("amount", "")

            if not description:
                continue

            result = classify(description, db)

            results.append({
                "description": description,
                "amount": amount,
                "category": result["category"],
                "method": result["method"],
                "needs_review": result["needs_review"],
                "is_bad_spend": result["category"] in bad_set
            })

        return {
            "count": len(results),
            "transactions": results
        }

    finally:
        db.close()

# ── Manual Override Route ─────────────────────────────────────────────────

@app.post("/cache/override")
def override_cache(body: CacheOverride):

    if body.category not in ALL_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category: {body.category}"
        )

    db = get_db()

    try:

        db.execute("""
            INSERT OR REPLACE INTO merchant_cache
            (merchant, category, method)
            VALUES (?, ?, 'user')
        """, (body.merchant.lower(), body.category))

        db.commit()

        return {"status": "updated"}

    finally:
        db.close()

# ── Cache Viewer ──────────────────────────────────────────────────────────

@app.get("/cache")
def list_cache():

    db = get_db()

    try:

        rows = db.execute("""
            SELECT *
            FROM merchant_cache
            ORDER BY created_at DESC
        """).fetchall()

        return [dict(r) for r in rows]

    finally:
        db.close()
#!/usr/bin/env python3
"""
Fire several POST /classify-one requests in parallel using curl (subprocess).

Requires: curl on PATH, classifier running (default http://127.0.0.1:8000).

  CLASSIFIER_URL=http://127.0.0.1:8000 python3 test_concurrent_curl.py

Equivalent manual curls look like:

  curl -sS -X POST "http://127.0.0.1:8000/classify-one" \\
    -H "Content-Type: application/json" \\
    -d '{"description":"TESCO STORE","amount":42.50}'
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any


def _base_url() -> str:
    return os.getenv("CLASSIFIER_URL", "http://127.0.0.1:8000").rstrip("/")


def _curl_classify_one(base: str, description: str, amount: float) -> tuple[dict[str, Any], str, float]:
    payload = json.dumps({"description": description, "amount": amount}, ensure_ascii=False)
    t0 = time.perf_counter()
    with tempfile.NamedTemporaryFile(prefix="classify_", suffix=".json", delete=False) as tmp:
        out_path = Path(tmp.name)

    try:
        cmd = [
            "curl",
            "-sS",
            "-o",
            str(out_path),
            "-w",
            "%{http_code}",
            "-X",
            "POST",
            f"{base}/classify-one",
            "-H",
            "Content-Type: application/json",
            "-d",
            payload,
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        elapsed = time.perf_counter() - t0
        if proc.returncode != 0:
            raise RuntimeError(proc.stderr.strip() or f"curl exit {proc.returncode}")

        status = proc.stdout.strip()
        body_text = out_path.read_text(encoding="utf-8")
        if status != "200":
            raise RuntimeError(f"HTTP {status}: {body_text[:500]}")

        return json.loads(body_text), status, elapsed
    finally:
        out_path.unlink(missing_ok=True)


def main() -> int:
    base = _base_url()
    cases: list[tuple[str, float]] = [
        # Retail / travel / subs (original mix)
        ("TESCO STORES 4281", 47.83),
        ("SHELL PETROL STATION M4", 62.00),
        ("NETFLIX.COM", 15.99),
        ("UBER *TRIP HELP.UBER.COM", 12.40),
        ("AMZN MARKETPLACE UK", 89.00),
        ("STARBUCKS COFFEE #4412", 4.65),
        ("NATIONAL RAIL TICKETS", 145.50),
        ("UNKNOWN MERCHANT XYZ999", 3.14),
        # Amount extremes & signed quirks (many feeds use negatives for debits)
        ("CARD PAYMENT CONTACTLESS", 0.01),
        ("INSTORE CHIP AND PIN", -18.40),
        ("OVERSEAS FX MARKUP ADJ", -2499.99),
        ("ROUNDING ADJUSTMENT", -0.00),
        # Ambiguous / multi‑signal strings (fuel vs shop, big‑box, pharmacy)
        ("Z ENERGY LTD    SHOP", -12.50),
        ("BP CONNECT CAFE MASTERTON", -19.99),
        ("CHEMIST WAREHOUSE ONLINE", 8.90),
        ("CHEMIST WAREHOUSE STORE", 189.00),
        ("THE WAREHOUSE GROUP ONLINE ORD", 14.00),
        ("THE WAREHOUSE GROUP STORE PURCHASE", 620.00),
        # NZ‑shaped merchants vs offshore noise
        ("Pak'nSave Petone EFTPOS", -112.34),
        ("IRD PAYMENT – INCOME TAX", -840.00),
        ("Sharesies Limited TOP UP", -250.00),
        ("WECHAT PAY * STREET VENDOR SHANGHAI CN", -42.00),
        # Cash‑like, P2P, BNPL, cryptic refs
        ("ATM WITHDRAWAL QUEEN ST", -80.00),
        ("CASH DEP BRANCH #009", 500.00),
        ("PAYPAL *PERSONAL TRANSFER", -55.00),
        ("AFTERPAY                 SYDNEY AU", -63.45),
        ("CARD AUTHORISATION HOLD AIRBNB * HM ABC123", -1.00),
        ("FT942991831029384756291029384756291  DD FROM ?", -999.00),
        # Encoding / punctuation / “human messy” lines
        ("Café Rouge — Coventry Touch Pay", 26.50),
        ("McDonald's #904 • Drive Thru", -9.20),
        ("預付卡充值 WECHAT CN SHOP", 120.00),
        ("GOOGLE *TEMPORARY HOLD g.co/helppay#", -1.00),
        ("APPLE.COM/BILL           CORK IE", 7.99),
        # Subscription vs one‑off vs gaming blur
        ("DISNEY PLUS MONTHLY", -12.99),
        ("STEAM PURCHASE  STEAMPowered.com", -59.99),
        ("OFFICE365 HOME MICROSOFT   MSBILL.INFO", -79.99),
        # Long noisy descriptor (single line, like scraped CSV)
        (
            "POS PURCHASE VISA DEBIT MERCHANT NAME TRUNCATED EXTRA LONG "
            "FIELD REF 88776655443322110099887766554433221100998877665544332211009988776655443322110099",
            -34.56,
        ),
    ]

    print(f"Base URL: {base}")
    print(f"Parallel classify-one requests: {len(cases)}\n")

    t_wall = time.perf_counter()
    results: list[tuple[str, float, dict[str, Any], float]] = []

    with ThreadPoolExecutor(max_workers=min(16, len(cases))) as pool:
        future_map = {
            pool.submit(_curl_classify_one, base, desc, amt): (desc, amt)
            for desc, amt in cases
        }
        for fut in as_completed(future_map):
            desc, amt = future_map[fut]
            try:
                body, _status, elapsed = fut.result()
                results.append((desc, amt, body, elapsed))
            except Exception as e:
                print(f"FAIL {desc!r} amount={amt}: {e}", file=sys.stderr)
                return 1

    results.sort(key=lambda r: (r[0], r[1]))
    wall = time.perf_counter() - t_wall

    for desc, amt, body, elapsed in results:
        cat = body.get("category", "?")
        src = body.get("source", "?")
        print(f"{elapsed:6.2f}s  {amt:9.2f}  [{src:5}] {cat:20}  {desc}")

    print(f"\nWall-clock for all {len(cases)} requests: {wall:.2f}s")
    return 0


if __name__ == "__main__":
    sys.exit(main())

"""Deterministic normalization for rule matching."""

from __future__ import annotations

import re

_BANK_NOISE = re.compile(
    r"\b(?:pos|eftpos|debit|credit|visa|mastercard)\b",
    re.IGNORECASE,
)
_DIGITS = re.compile(r"\d+")
_NON_LETTER_OR_SPACE = re.compile(r"[^a-z\s]")
_WHITESPACE = re.compile(r"\s+")


def normalize(description: str) -> str:
    """Lowercase, strip bank noise, digits, punctuation; collapse whitespace."""
    s = description.lower()
    s = _BANK_NOISE.sub(" ", s)
    s = _DIGITS.sub(" ", s)
    s = _NON_LETTER_OR_SPACE.sub(" ", s)
    s = _WHITESPACE.sub(" ", s).strip()
    return s

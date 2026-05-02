"""Merchant rules: pre-compiled regex, evaluated on normalized descriptions."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Callable

from normalize_text import normalize

AmountLogic = Callable[[float], str]


def _fuel_amount_logic(amount: float) -> str:
    """Small debits (closer to zero) → shop/snacks; larger fuel purchase → transport."""
    # Note: Using -20 assumes negative values for debits.
    return "fast_food" if amount > -20 else "transport"


def _w(*tokens: str) -> list[re.Pattern[str]]:
    """Word-boundary patterns; tokens are literal substrings."""
    return [re.compile(rf"\b{re.escape(t)}\b") for t in tokens]


def _p(expr: str) -> re.Pattern[str]:
    return re.compile(expr)


@dataclass(frozen=True)
class Rule:
    key: str
    category: str
    patterns: tuple[re.Pattern[str], ...]
    amount_logic: AmountLogic | None = None


# Grouped merchants; tailored for New Zealand (NZ) market.
# Order matters: first pattern match wins across all rules below.
RULES: list[Rule] = [
    Rule(
        "supermarkets",
        "groceries",
        tuple(
            _w(
                "pak n save",
                "paknsave",
                "pak-save",
                "new world",
                "countdown",
                "nw metro",
                "woolworths",
                "woolworths nz",
                "four square",
                "freshchoice",
                "fresh choice",
                "supervalue",
                "farro",
                "moore wilson",
                "huckleberry",
                "bin inn",
                "costco",
                "warehouse extra",
                "raeward fresh",
                "new world metro",
                "countdown metro",
                "kai nz",
                "super minimart",
                "hong kong supermarket",
            )
        ),
    ),
    Rule(
        "meal_delivery",
        "fast_food",
        tuple(
            _w(
                "uber eats",
                "ubereats",
                "deliveroo",
                "menulog",
                "door dash",
                "doordash",
                "hellofresh",
                "hello fresh",
                "my food bag",
                "woop",
                "food bag",
                "my mate",
                "chefgood",
            )
        ),
    ),
    Rule(
        "fast_food",
        "fast_food",
        tuple(
            _w(
                "mcdonalds",
                "mcdonald",
                "mc donalds",
                "mcd ltd",
                "kfc",
                "subway",
                "burger king",
                "burgerking",
                "bk nz",
                "pizza hut",
                "pizzahut",
                "dominos",
                "dominoes",
                "wendys",
                "taco bell",
                "st pierre",
                "st pierres",
                "sushi train",
                "gong cha",
                "chatime",
                "boost juice",
                "roll n bowl",
                "wagamama",
                "schnitz",
                "nandos",
                "oporto",
                "cookie time",
                "jollibee",
                "burgerfuel",
                "burger fuel",
                "hell pizza",
                "pitapit",
                "pita pit",
                "tank juice",
                "texas chicken",
                "carls jr",
                "night n day",
                "jesters",
                "muffin break",
                "coffee club",
                "sals pizza",
                "sal s pizza",
                "mexicali",
                "mad mex",
                "zambrero",
                "habibi",
                "best ugly bagels",
                "wisconsin burger",
                "ljs",
                "re burger",
                "wishbone",
                "noodle canteen",
                "pepes",
                "rollickin",
            )
            + [_p(r"\bmcd\b")]
        ),
    ),
    Rule(
        "coffee_snack",
        "fast_food",
        tuple(
            _w(
                "starbucks",
                "mojo coffee",
                "mojo",
                "robert harris",
                "mochawarehouse",
                "daily grind",
                "atomic coffee",
                "coffee supreme",
                "havana coffee",
                "little lokal",
                "duck island",
                "giapo",
                "gelato messina",
                "messina",
                "patagonia",
                "rollovers",
                "ben jerry",
                "joes garage",
                "joe s garage",
                "espresso",
                "espresso republic",
                "caffe",
                "bakery",
                "wild bean cafe",
                "z espresso",
                "bp wild bean",
            )
        ),
    ),
    Rule(
        "subscriptions_streaming_saas",
        "subscriptions",
        tuple(
            _w(
                "netflix",
                "spotify",
                "disney plus",
                "disneyplus",
                "amazon prime",
                "prime video",
                "hbo",
                "apple tv",
                "now tv",
                "audible",
                "paramount",
                "paramountplus",
                "primevideo",
                "crunchyroll",
                "deezer",
                "youtube premium",
                "youtube nz",
                "neon",
                "sky sport",
                "sky sport now",
                "sky network",
                "skytv nz",
                "sky box",
                "mysky",
                "dazn",
                "office365",
                "office 365",
                "msbill",
                "microsoft 365",
                "microsoft bill",
                "msft",
                "adobe",
                "icloud",
                "google storage",
                "google workspace",
                "google one",
                "dropbox",
                "notion",
                "slack",
                "zoom",
                "evernote",
                "grammarly",
                "chatgpt",
                "openai",
                "github",
                "gitlab",
                "canva",
                "one password",
                "1password",
                "lastpass",
                "surfshark",
                "nordvpn",
                "expressvpn",
                "dashlane",
            )
            + [_p(r"\bapple\.com/bill\b")]
        ),
    ),
    Rule(
        "taxes_fees",
        "taxes_fees",
        tuple(
            _w(
                "hmrc",
                "dvla",
                "tv licensing",
                "ird",
                "inland revenue",
                "income tax",
                "nzta",
                "waka kotahi",
                "vehicle licensing",
                "rego",
                "road user charges",
                "bank charge",
                "overdraft fee",
                "fx markup",
                "foreign exchange",
                "interest charge",
                "late payment fee",
                "account fee",
            )
        ),
    ),
    Rule(
        "fuel_stations",
        "transport",
        tuple(
            _w(
                "z energy", "caltex", "bp", "mobil", "gull", "waitomo", "allied fuel", "nps", "challenge",
                "npd", "rd petroleum", "ap petrol", "allied petroleum", "z service station", "z express",
            )
            + [_p(r"\bz\s*energy\b"), _p(r"\bzenergy\b")]
        ),
        amount_logic=_fuel_amount_logic,
    ),
    Rule(
        "public_transit",
        "transport",
        tuple(
            _w(
                "at hop", "at.govt.nz", "metlink", "snapper", "metrocard", "beecard", "bee card",
                "fullers", "intercity", "kiwirail", "tranzalpine", "coastal pacific", "capital connection",
                "te huia", "bluebridge", "interislander", "skydrive"
            )
        ),
    ),
    Rule(
        "rideshare_taxi",
        "transport",
        tuple(_w("uber", "ola", "zoomy", "blue bubble", "corporate cabs", "nz taxi", "alert taxis")),
    ),
    Rule(
        "parking_tolls",
        "transport",
        tuple(_w("at parking", "wilson parking", "parkmate", "paymy_park", "pay my park", "tcc parking", "parkable")),
    ),
    Rule(
        "travel",
        "travel",
        tuple(
            _w(
                "air new zealand",
                "airnz",
                "jetstar",
                "qantas",
                "singapore airlines",
                "emirates",
                "booking com",
                "airbnb",
                "expedia",
                "hotels com",
                "rentalcars",
            )
        ),
    ),
    Rule(
        "utilities",
        "utilities",
        tuple(
            _w(
                "mercury", "genesis", "contact energy", "meridian", "trustpower", "electric kiwi",
                "nova energy", "powershop", "flick electric", "globug", "frank energy",
                "spark", "one nz", "vodafone", "2degrees", "skinny", "slingshot", "vocus", "chorus",
                "watercare", "veolia", "orcon", "bigpipe", "now broadband"
            )
        ),
    ),
    Rule(
        "housing",
        "housing",
        tuple(_w("rates", "council", "rent", "property management", "barfoot", "harcourts", "ray white", "quinovic")),
    ),
    Rule(
        "health_pharmacy",
        "health",
        tuple(_w("chemist warehouse", "unichem", "life pharmacy", "bargain chemist", "pharmacy", "medical centre",
                 "green cross health", "ascension pharma", "pharmacy express", "apollo pharmacy",
                 "lumino the dentists", "lumino dental", "smile dental")),
    ),
    Rule(
        "pets",
        "pets",
        tuple(_w("animates", "petstock", "pet direct", "pet circle", "pet station")),
    ),
    Rule(
        "savings_investments",
        "savings_investments",
        tuple(_w("sharesies", "kernel", "milford", "hatch invest", "investnow")),
    ),
    Rule(
        "fitness",
        "fitness",
        tuple(_w("les mills", "cityfitness", "anytime fitness", "snap fitness", "jetts", "f45",
                 "club physical", "next gen gym", "ymca")),
    ),
    Rule(
        "entertainment",
        "entertainment",
        tuple(
            _w(
                "event cinemas",
                "hoyts",
                "reading cinema",
                "reading cinemas",
                "imax",
                "skycity",
                "sky city",
                "lotto",
                "my lotto",
                "lotto nz",
                "tab nz",
                "the tab",
                "steam",
                "valve",
                "playstation",
                "xbox live",
                "xbox game pass",
                "nintendo eshop",
                "epic games",
                "origin games",
                "riot games",
                "ubisoft",
                "rockstar games",
            )
        ),
    ),
    Rule(
        "lifestyle_pubs_betting",
        "lifestyle",
        tuple(
            _w(
                "brewdog",
                "wetherspoon",
                "william hill",
                "bet365",
                "paddy power",
                "ladbrokes",
                "skybet",
            )
        ),
    ),
    Rule(
        "technology_retail",
        "technology",
        tuple(_w("wechat", "wechat pay", "alipay", "pb tech", "jb hi fi", "noel leeming", "computer lounge")),
    ),
    Rule(
        "retail_general",
        "shopping",
        tuple(_w("the warehouse", "kmart", "farmers", "rebelsport", "mighty ape", "temu", "amazon", "ebay",
                 "dress smart", "hannahs", "warehouse stationery")),
    ),
    Rule(
        "home_improvement",
        "home",
        tuple(_w("mitre 10", "bunnings", "placemakers", "itm", "ikea", "freedom furniture", "briscoes")),
    ),
    Rule(
        "insurance",
        "insurance",
        tuple(_w("southern cross", "aia", "aianz", "state insurance", "ami", "tower", "aa insurance", "vero",
                 "nib", "amp insurance", "cove insurance", "partners life")),
    ),
]


def classify_with_rules(description: str, amount: float) -> str | None:
    """Return category slug on first match; otherwise None."""
    normalized_description = normalize(description)
    if not normalized_description:
        return None
    for rule in RULES:
        for pattern in rule.patterns:
            if pattern.search(normalized_description):
                if rule.amount_logic is not None:
                    return rule.amount_logic(amount)
                return rule.category
    return None
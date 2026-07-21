from __future__ import annotations

import json
import re
from pathlib import Path

from Sastrawi.Stemmer.StemmerFactory import StemmerFactory

_BASE_DIR = Path(__file__).resolve().parents[2]
_ASSET_PATH = (
    _BASE_DIR
    / "data"
    / "runtime_assets.json"
)

_STEMMER = (
    StemmerFactory()
    .create_stemmer()
)

_STOPWORDS = {
    "yang",
    "dan",
    "di",
    "ke",
    "dari",
    "untuk",
    "dengan",
    "atau",
    "pada",
    "adalah",
    "itu",
    "ini",
    "saya",
    "kami",
    "kamu",
    "bagaimana",
    "cara",
    "apa",
    "kapan",
    "dimana",
}

_NON_ALNUM = re.compile(
    r"[^a-zA-Z0-9\s]"
)


def _load_lexicon() -> dict[str, str | None]:
    if not _ASSET_PATH.exists():
        return {}

    payload = json.loads(
        _ASSET_PATH.read_text(
            encoding="utf-8",
        )
    )

    if payload.get("version") != 1:
        return {}

    return payload.get(
        "lexicon",
        {},
    )


_LEXICON = _load_lexicon()


def preprocess(
    text: object,
) -> list[str]:
    normalized = _NON_ALNUM.sub(
        " ",
        str(text or "").lower(),
    )

    tokens: list[str] = []

    for token in normalized.split():
        if not token:
            continue

        if (
            not token.isdigit()
            and len(token) <= 2
        ):
            continue

        if token in _STOPWORDS:
            continue

        if token.isdigit():
            tokens.append(token)
            continue

        if token in _LEXICON:
            stemmed = _LEXICON[token]

            if stemmed:
                tokens.append(stemmed)

            continue

        tokens.append(
            _STEMMER.stem(token)
        )

    return tokens

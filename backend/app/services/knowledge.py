from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parents[2] / "data"


@lru_cache(maxsize=1)
def _load() -> dict[str, Any]:
    return json.loads((DATA_DIR / "agronomy.json").read_text(encoding="utf-8"))


def disease_remedy(disease_key: str) -> dict[str, Any]:
    data = _load()["diseases"]
    return data.get(disease_key, data["unknown"])


def soil_guidance(soil_type: str) -> dict[str, Any]:
    data = _load()["soils"]
    return data.get(soil_type, data["loamy"])

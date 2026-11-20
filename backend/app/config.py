from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = PROJECT_ROOT / "backend"


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except (TypeError, ValueError):
        return default


@dataclass(frozen=True)
class Settings:
    app_env: str = os.getenv("APP_ENV", "demo")
    max_upload_bytes: int = _env_int("MAX_UPLOAD_BYTES", 10 * 1024 * 1024)
    min_image_side: int = _env_int("MIN_IMAGE_SIDE", 64)
    max_image_pixels: int = _env_int("MAX_IMAGE_PIXELS", 40_000_000)
    rate_limit_requests: int = _env_int("RATE_LIMIT_REQUESTS", 60)
    rate_limit_window_seconds: int = _env_int("RATE_LIMIT_WINDOW_SECONDS", 60)
    cors_origins: tuple[str, ...] = tuple(
        item.strip()
        for item in os.getenv("CORS_ORIGINS", "http://localhost:8080,http://127.0.0.1:8080").split(",")
        if item.strip()
    )


settings = Settings()

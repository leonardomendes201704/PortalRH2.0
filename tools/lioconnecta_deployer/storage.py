from __future__ import annotations

import json
from pathlib import Path

from .models import AppConfig


CONFIG_DIR = Path(__file__).resolve().parent / "config"
CONFIG_FILE = CONFIG_DIR / "deployer-config.json"


def load_config() -> AppConfig:
    if not CONFIG_FILE.exists():
        return AppConfig()

    raw = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    return AppConfig.from_dict(raw)


def save_config(config: AppConfig) -> Path:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    CONFIG_FILE.write_text(
        json.dumps(config.to_dict(), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return CONFIG_FILE


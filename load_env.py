import os
from pathlib import Path

_ROOT = Path(__file__).resolve().parent
_ENV_PATH = _ROOT / ".env"


def load_env():
    if not _ENV_PATH.exists():
        return

    for line in _ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value

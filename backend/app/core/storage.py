"""Filesystem helpers for task attachments. Paths are never taken from user input."""

from pathlib import Path
from app.core.config import settings

BACKEND_ROOT = Path(__file__).resolve().parents[2]


def upload_root() -> Path:
    configured = Path(settings.UPLOAD_DIR)
    root = configured if configured.is_absolute() else (BACKEND_ROOT / configured)
    root.mkdir(parents=True, exist_ok=True)
    return root.resolve()


def stored_file_path(stored_filename: str) -> Path:
    root = upload_root()
    candidate = (root / Path(stored_filename).name).resolve()
    if candidate.parent != root:
        raise ValueError("Resolved path escapes the upload directory.")
    return candidate


def max_upload_bytes() -> int:
    return int(settings.MAX_UPLOAD_SIZE_MB) * 1024 * 1024

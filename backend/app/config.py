"""Application settings.

Every field can be overridden with a ``HUB_``-prefixed environment variable
(for example ``HUB_LOOKBACK_DAYS=14``) or a ``backend/.env`` file.
"""
from __future__ import annotations

import os
import shutil
import subprocess
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BACKEND_DIR / "data"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env", env_prefix="HUB_", extra="ignore"
    )

    database_url: str = f"sqlite:///{(DATA_DIR / 'hub.db').as_posix()}"
    github_token: str | None = None
    hf_token: str | None = None

    lookback_days: int = 45  # how far back the fetchers look for new items
    refresh_hours: float = 6.0  # periodic refresh interval; 0 runs once at startup only
    refresh_on_startup: bool = True
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    github_per_query: int = 30
    hf_per_query: int = 50
    arxiv_per_query: int = 60

    def resolve_github_token(self) -> str | None:
        """Use an explicit token, else GITHUB_TOKEN, else the logged-in GitHub CLI."""
        if self.github_token:
            return self.github_token
        if os.environ.get("GITHUB_TOKEN"):
            return os.environ["GITHUB_TOKEN"]
        gh = _find_gh()
        if gh:
            try:
                out = subprocess.run(
                    [gh, "auth", "token"], capture_output=True, text=True, timeout=5
                )
                if out.returncode == 0 and out.stdout.strip():
                    return out.stdout.strip()
            except (OSError, subprocess.SubprocessError):
                pass
        return None


def _find_gh() -> str | None:
    """Locate the GitHub CLI even when it is not on this process's PATH (common on Windows)."""
    found = shutil.which("gh")
    if found:
        return found
    local = Path(os.environ.get("LOCALAPPDATA", Path.home() / "AppData" / "Local"))
    candidates = [
        local / "Microsoft" / "WinGet" / "Links" / "gh.exe",
        Path(os.environ.get("ProgramFiles", r"C:\Program Files")) / "GitHub CLI" / "gh.exe",
        *sorted((local / "Microsoft" / "WinGet" / "Packages").glob("GitHub.cli_*/bin/gh.exe")),
        Path("/usr/local/bin/gh"),
        Path("/opt/homebrew/bin/gh"),
    ]
    for candidate in candidates:
        if candidate.is_file():
            return str(candidate)
    return None


settings = Settings()

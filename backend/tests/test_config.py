from pathlib import Path

from app import config


def test_explicit_token_wins(monkeypatch):
    monkeypatch.setenv("GITHUB_TOKEN", "env-token")
    s = config.Settings(github_token="explicit")
    assert s.resolve_github_token() == "explicit"


def test_env_token_used_when_no_explicit(monkeypatch):
    monkeypatch.setenv("GITHUB_TOKEN", "env-token")
    s = config.Settings(github_token=None)
    assert s.resolve_github_token() == "env-token"


def test_falls_back_to_gh_cli(monkeypatch, tmp_path: Path):
    monkeypatch.delenv("GITHUB_TOKEN", raising=False)
    fake_gh = tmp_path / "gh.exe"
    fake_gh.write_text("")
    monkeypatch.setattr(config, "_find_gh", lambda: str(fake_gh))

    class Result:
        returncode = 0
        stdout = "cli-token\n"

    monkeypatch.setattr(config.subprocess, "run", lambda *a, **k: Result())
    s = config.Settings(github_token=None)
    assert s.resolve_github_token() == "cli-token"


def test_no_token_when_cli_missing(monkeypatch):
    monkeypatch.delenv("GITHUB_TOKEN", raising=False)
    monkeypatch.setattr(config, "_find_gh", lambda: None)
    s = config.Settings(github_token=None)
    assert s.resolve_github_token() is None


def test_find_gh_checks_winget_path(monkeypatch, tmp_path: Path):
    monkeypatch.setattr(config.shutil, "which", lambda _: None)
    monkeypatch.setenv("LOCALAPPDATA", str(tmp_path))
    monkeypatch.setenv("ProgramFiles", str(tmp_path / "pf"))
    gh = tmp_path / "Microsoft" / "WinGet" / "Links" / "gh.exe"
    gh.parent.mkdir(parents=True)
    gh.write_text("")
    assert config._find_gh() == str(gh)

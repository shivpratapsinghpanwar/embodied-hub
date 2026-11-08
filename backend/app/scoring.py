"""Trending score: popularity damped by age so brand-new things can surface."""
from __future__ import annotations

import math
from datetime import datetime, timezone

HALF_LIFE_DAYS = 14.0


def compute_score(
    stars: int, downloads: int, published_at: datetime, now: datetime | None = None
) -> float:
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    if published_at.tzinfo is None:
        published_at = published_at.replace(tzinfo=timezone.utc)
    age_days = max((now - published_at).total_seconds() / 86400.0, 0.0)
    freshness = math.exp(-age_days * math.log(2) / HALF_LIFE_DAYS)
    popularity = 1.0 + math.log1p(max(stars, 0)) + 0.3 * math.log1p(max(downloads, 0))
    return round(popularity * (0.3 + 0.7 * freshness), 4)

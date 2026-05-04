"""
GCS-backed telemetry cache.

Provides read-through caching for FastF1 telemetry by storing serialized
TelemetryPoint lists as JSON objects in a GCS bucket.

Behavior:
- If env var GCS_TELEMETRY_BUCKET is unset, the cache is disabled and all
  read/write helpers become no-ops. This keeps local dev / CI working
  without GCP credentials.
- On any GCS error (network, auth, missing bucket), we log and return as
  if the cache was a miss, so the caller falls back to FastF1 directly.
- We only persist data for sessions whose date_end is at least
  CACHE_FREEZE_AGE_HOURS in the past (i.e. the session is "settled" and
  won't change). For very recent / live sessions we skip writes.
"""
from __future__ import annotations

import json
import logging
import os
import threading
import time
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from app.models.schemas import TelemetryPoint

logger = logging.getLogger(__name__)

# Schema version. Bump when TelemetryPoint fields change in a way that breaks
# old cached objects (then optionally clean up the previous prefix).
CACHE_KEY_PREFIX = "telemetry/v1"

# Only cache sessions older than this. F1 results sometimes get adjusted
# (penalties, post-race scrutineering) within a few hours; 24h is a safe
# settling window after which telemetry data is effectively immutable.
CACHE_FREEZE_AGE_HOURS = 24

# Backoff window before retrying init after a transient failure (e.g. auth
# blip). Permanent disables (env var unset) use math.inf instead.
_INIT_RETRY_COOLDOWN_SECONDS = 300

_client = None
_bucket = None
# Monotonic time after which init may be retried. None = retry now.
# float('inf') = never retry (permanent disable).
_disabled_until: Optional[float] = None
_init_lock = threading.Lock()


def _init() -> bool:
    """Lazily initialize the GCS client. Returns True if cache is usable.

    Thread-safe via double-checked locking. Re-attempts initialization after a
    cooldown if a previous attempt failed transiently, so a brief auth/network
    outage doesn't disable the cache for the entire process lifetime.
    """
    global _client, _bucket, _disabled_until

    # Fast path without locking
    if _bucket is not None:
        return True
    if _disabled_until is not None and time.monotonic() < _disabled_until:
        return False

    with _init_lock:
        # Re-check inside the lock
        if _bucket is not None:
            return True
        if _disabled_until is not None and time.monotonic() < _disabled_until:
            return False

        bucket_name = os.environ.get("GCS_TELEMETRY_BUCKET", "").strip()
        if not bucket_name:
            # Env var won't change at runtime, so disable permanently
            _disabled_until = float("inf")
            logger.info("[cache] disabled: GCS_TELEMETRY_BUCKET not set")
            return False

        try:
            from google.cloud import storage  # type: ignore

            _client = storage.Client()
            _bucket = _client.bucket(bucket_name)
            _disabled_until = None
            logger.info("[cache] enabled: bucket=%s", bucket_name)
            return True
        except Exception as e:
            _disabled_until = time.monotonic() + _INIT_RETRY_COOLDOWN_SECONDS
            logger.warning(
                "[cache] init failed (will retry in %ds): %s",
                _INIT_RETRY_COOLDOWN_SECONDS,
                e,
            )
            return False


def _object_name(session_key: int, driver_number: int, lap_number: int) -> str:
    return f"{CACHE_KEY_PREFIX}/{session_key}/{driver_number}/{lap_number}.json"


def get_telemetry(
    session_key: int, driver_number: int, lap_number: int
) -> Optional[List[TelemetryPoint]]:
    """Try to read cached telemetry. Returns None on miss or any error.

    Uses a single GCS download call with NotFound catch instead of an
    explicit exists() probe, halving the per-miss latency.
    """
    if not _init():
        return None
    try:
        from google.cloud.exceptions import NotFound  # type: ignore

        blob = _bucket.blob(_object_name(session_key, driver_number, lap_number))
        try:
            raw = blob.download_as_bytes()
        except NotFound:
            return None
        data = json.loads(raw)
        return [TelemetryPoint(**p) for p in data]
    except Exception as e:
        logger.warning(
            "[cache] read failed for session=%s driver=%s lap=%s: %s",
            session_key,
            driver_number,
            lap_number,
            e,
        )
        return None


def put_telemetry(
    session_key: int,
    driver_number: int,
    lap_number: int,
    points: List[TelemetryPoint],
    session_date_end_iso: Optional[str] = None,
) -> None:
    """
    Write telemetry to cache, but only if the session is settled (older than
    CACHE_FREEZE_AGE_HOURS) so we never cache live/in-progress data.
    """
    if not _init():
        return
    if not points:
        return
    if not _is_session_settled(session_date_end_iso):
        return
    try:
        blob = _bucket.blob(_object_name(session_key, driver_number, lap_number))
        payload = json.dumps([p.model_dump() for p in points], ensure_ascii=False)
        blob.upload_from_string(payload, content_type="application/json")
        logger.info(
            "[cache] wrote %d points for session=%s driver=%s lap=%s",
            len(points),
            session_key,
            driver_number,
            lap_number,
        )
    except Exception as e:
        logger.warning(
            "[cache] write failed for session=%s driver=%s lap=%s: %s",
            session_key,
            driver_number,
            lap_number,
            e,
        )


def _is_session_settled(date_end_iso: Optional[str]) -> bool:
    """A session is 'settled' once it ended at least CACHE_FREEZE_AGE_HOURS ago."""
    if not date_end_iso:
        # If we don't know the date_end, be conservative and don't cache.
        return False
    try:
        end = datetime.fromisoformat(date_end_iso.replace("Z", "+00:00"))
        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)
        return datetime.now(timezone.utc) - end >= timedelta(hours=CACHE_FREEZE_AGE_HOURS)
    except Exception:
        return False

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
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from app.models.schemas import TelemetryPoint

logger = logging.getLogger(__name__)

CACHE_KEY_PREFIX = "telemetry/v1"
CACHE_FREEZE_AGE_HOURS = 24  # only cache sessions older than this

_client = None
_bucket = None
_disabled_reason: Optional[str] = None


def _init() -> bool:
    """Lazily initialize the GCS client. Returns True if cache is usable."""
    global _client, _bucket, _disabled_reason

    if _bucket is not None:
        return True
    if _disabled_reason is not None:
        return False

    bucket_name = os.environ.get("GCS_TELEMETRY_BUCKET", "").strip()
    if not bucket_name:
        _disabled_reason = "GCS_TELEMETRY_BUCKET not set"
        logger.info("[cache] disabled: %s", _disabled_reason)
        return False

    try:
        from google.cloud import storage  # type: ignore

        _client = storage.Client()
        _bucket = _client.bucket(bucket_name)
        logger.info("[cache] enabled: bucket=%s", bucket_name)
        return True
    except Exception as e:
        _disabled_reason = f"init failed: {e}"
        logger.warning("[cache] disabled: %s", _disabled_reason)
        return False


def _object_name(session_key: int, driver_number: int, lap_number: int) -> str:
    return f"{CACHE_KEY_PREFIX}/{session_key}/{driver_number}/{lap_number}.json"


def get_telemetry(
    session_key: int, driver_number: int, lap_number: int
) -> Optional[List[TelemetryPoint]]:
    """Try to read cached telemetry. Returns None on miss or any error."""
    if not _init():
        return None
    try:
        blob = _bucket.blob(_object_name(session_key, driver_number, lap_number))
        if not blob.exists():
            return None
        raw = blob.download_as_bytes()
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

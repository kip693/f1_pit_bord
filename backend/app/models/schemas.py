from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SessionResponse(BaseModel):
    session_key: int
    session_name: str
    session_type: str
    date_start: str
    date_end: str
    gmt_offset: str
    meeting_key: int
    location: str
    country_name: str
    country_code: str
    circuit_key: int
    circuit_short_name: str
    year: int


class LapResponse(BaseModel):
    meeting_key: int
    session_key: int
    driver_number: int
    lap_number: int
    lap_duration: Optional[float] = None
    duration_sector_1: Optional[float] = None
    duration_sector_2: Optional[float] = None
    duration_sector_3: Optional[float] = None
    compound: Optional[str] = None
    tyre_life: Optional[int] = None
    is_pit_out_lap: bool
    i1_speed: Optional[int] = None
    i2_speed: Optional[int] = None
    st_speed: Optional[int] = None
    date_start: Optional[str] = None
    total_seconds: Optional[float] = None


class TelemetryPoint(BaseModel):
    date: str
    speed: int
    rpm: int
    gear: int
    throttle: int
    brake: bool
    drs: int
    distance: float
    rel_distance: float


class DriverResponse(BaseModel):
    driver_number: int
    name_acronym: str
    full_name: str
    team_name: str
    team_colour: str

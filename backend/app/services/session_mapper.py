import requests
from typing import Optional, Tuple
from functools import lru_cache

OPENF1_BASE_URL = "https://api.openf1.org/v1"


@lru_cache(maxsize=100)
def get_session_info(session_key: int) -> Optional[dict]:
    """
    Get session information from OpenF1 API
    Returns session details including year, location, session_name, etc.
    """
    try:
        response = requests.get(
            f"{OPENF1_BASE_URL}/sessions",
            params={"session_key": session_key},
            timeout=10
        )
        response.raise_for_status()
        sessions = response.json()
        
        if sessions and len(sessions) > 0:
            return sessions[0]
        return None
    except Exception as e:
        print(f"Error fetching session info: {e}")
        return None


def session_key_to_fastf1_params(session_key: int) -> Optional[Tuple[int, str, str]]:
    """
    Convert OpenF1 session_key to FastF1 parameters (year, event, session_type)
    
    Returns:
        Tuple of (year, event_name, session_type) or None if conversion fails
    """
    session_info = get_session_info(session_key)
    
    if not session_info:
        return None
    
    year = session_info.get('year')
    location = session_info.get('location')  # e.g., "Bahrain", "Saudi Arabia"
    session_name = session_info.get('session_name')  # e.g., "Race", "Qualifying"
    
    # Map OpenF1 session_name to FastF1 session_type
    session_type_map = {
        'Practice 1': 'FP1',
        'Practice 2': 'FP2',
        'Practice 3': 'FP3',
        'Qualifying': 'Q',
        'Sprint': 'S',
        'Sprint Qualifying': 'SQ',
        'Race': 'R',
    }
    
    session_type = session_type_map.get(session_name, 'R')  # Default to Race
    
    # Use location as event name (FastF1 accepts location names)
    event = location
    
    return (year, event, session_type)

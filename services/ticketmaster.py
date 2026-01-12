import os
from typing import Any, Dict, List, Optional

import requests

BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json"


def fetch_events(
    keyword: Optional[str] = None,
    start: Optional[str] = None,   # YYYY-MM-DD
    end: Optional[str] = None,     # YYYY-MM-DD
    size: int = 50,
    page: int = 0,
    country_code: str = "SE",
    city: Optional[str] = None,    
) -> List[Dict[str, Any]]:
    """
    Hämtar events från Ticketmaster och returnerar en normaliserad lista.

    Return-format (per event):
    {
      "id": str|None,
      "name": str|None,
      "localDate": str|None,
      "localTime": str|None,
      "venue": str|None,
      "city": str|None,
      "lat": str|None,
      "lng": str|None,
      "url": str|None,
    }
    """

    api_key = os.getenv("TICKETMASTER_API_KEY") or os.getenv("API_KEY")
    if not api_key:
        raise RuntimeError("Missing TICKETMASTER_API_KEY (eller API_KEY) i .env")

    try:
        size = int(size)
    except Exception:
        size = 50
    size = max(1, min(size, 200))

    try:
        page = int(page)
    except Exception:
        page = 0
    page = max(0, page)

    params: Dict[str, Any] = {
        "apikey": api_key,
        "size": size,
        "page": page,
        "locale": "*",
        "unit": "km",
        "countryCode": country_code,
    }

    if keyword:
        params["keyword"] = keyword.strip()


    if city:
        params["city"] = city


    if start:
        params["startDateTime"] = f"{start}T00:00:00Z"
    if end:
        params["endDateTime"] = f"{end}T23:59:59Z"

    try:
        r = requests.get(BASE_URL, params=params, timeout=15)
    except requests.RequestException as e:
        print("Ticketmaster request failed:", repr(e))
        return []

    if not r.ok:
        print("Ticketmaster error:", r.status_code)
        print("URL:", r.url)
        print("Body (first 500 chars):", r.text[:500])
        return []

    try:
        data = r.json()
    except ValueError:
        print("Ticketmaster returned non-JSON response")
        return []

    raw_events = ((data.get("_embedded") or {}).get("events")) or []
    out: List[Dict[str, Any]] = []

    for ev in raw_events:

        start_obj = ((ev.get("dates") or {}).get("start") or {})
        local_date = start_obj.get("localDate")
        local_time = start_obj.get("localTime")

 
        venues = ((ev.get("_embedded") or {}).get("venues")) or []
        venue = venues[0] if venues else {}
        venue_name = venue.get("name")

        city_obj = venue.get("city") or {}
        city_name = city_obj.get("name")

        location = venue.get("location") or {}
        lat = location.get("latitude")
        lng = location.get("longitude")

        out.append(
            {
                "id": ev.get("id"),
                "name": ev.get("name"),
                "localDate": local_date,
                "localTime": local_time,
                "venue": venue_name,
                "city": city_name,
                "lat": lat,
                "lng": lng,
                "url": ev.get("url"),
            }
        )

    return out

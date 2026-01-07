import os
import requests
from functools import lru_cache

BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json"

def _to_float(v):
    try:
        return float(v) if v is not None else None
    except (TypeError, ValueError):
        return None


@lru_cache(maxsize=512)
def _geocode_osm(query: str):
    """Best-effort geocoding for venues that don't provide coordinates.

    Uses OpenStreetMap Nominatim. Returns (lat, lng) as floats or (None, None).
    """
    if not query:
        return (None, None)

    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": query,
        "format": "json",
        "limit": 1,
    }
    headers = {
        # Nominatim requires a User-Agent; keep it generic and non-personal.
        "User-Agent": "party-finder/1.0 (educational project)",
    }

    try:
        r = requests.get(url, params=params, headers=headers, timeout=10)
        r.raise_for_status()
        items = r.json() or []
        if not items:
            return (None, None)
        return (_to_float(items[0].get("lat")), _to_float(items[0].get("lon")))
    except Exception:
        return (None, None)


def _best_image_url(images):
    images = images or []
    if not images:
        return None
    return max(images, key=lambda img: img.get("width", 0)).get("url")

def fetch_events(
    city="Malmö",
    size=20,
    keyword=None,
    start=None,
    end=None,
    lat=None,
    lng=None,
    radius_km=10,
    geocode_missing=True,
):
    api_key = os.getenv("TICKETMASTER_API_KEY")
    if not api_key:
        raise RuntimeError("Missing TICKETMASTER_API_KEY (check your .env)")

    params = {
        "apikey": api_key,
        "size": size,
        "locale": "*",
        "unit": "km",
    }

    #  Om vi har koordinater: sök runt punkt
    if lat is not None and lng is not None:
        params["latlong"] = f"{lat},{lng}"
        params["radius"] = radius_km
    else:
        #  annars fallback till city-sök 
        params["city"] = city

    if keyword:
        params["keyword"] = keyword
    if start:
        params["startDateTime"] = start  # ISO, t.ex. 2025-12-01T00:00:00Z
    if end:
        params["endDateTime"] = end

    r = requests.get(BASE_URL, params=params, timeout=10)
    r.raise_for_status()
    data = r.json()

    events_raw = data.get("_embedded", {}).get("events", [])
    events = []

    for e in events_raw:
        venue = (e.get("_embedded", {}).get("venues") or [{}])[0]
        loc = venue.get("location") or {}
        start_obj = e.get("dates", {}).get("start", {})

        # Ticketmaster often returns lat/lng as strings; convert to floats for map libraries.
        ev_lat = _to_float(loc.get("latitude"))
        ev_lng = _to_float(loc.get("longitude"))

        # Some venues/events do not include coordinates. Best-effort geocode via OSM.
        if geocode_missing and (ev_lat is None or ev_lng is None):
            address_line = (venue.get("address") or {}).get("line1")
            city_name = (venue.get("city") or {}).get("name") or city
            venue_name = venue.get("name")
            parts = [p for p in [venue_name, address_line, city_name, "Sweden"] if p]
            q = ", ".join(parts)
            g_lat, g_lng = _geocode_osm(q)
            ev_lat = ev_lat if ev_lat is not None else g_lat
            ev_lng = ev_lng if ev_lng is not None else g_lng

        events.append({
            "id": e.get("id"),
            "name": e.get("name"),
            "url": e.get("url"),
            "dateTime": start_obj.get("dateTime"),
            "localDate": start_obj.get("localDate"),
            "localTime": start_obj.get("localTime"),
            "venue": venue.get("name"),
            "address": (venue.get("address") or {}).get("line1"),
            "city": (venue.get("city") or {}).get("name"),
            "lat": ev_lat,
            "lng": ev_lng,
            "image": _best_image_url(e.get("images")),
        })

    return events

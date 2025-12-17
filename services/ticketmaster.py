import os
import requests

BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json"

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
            "lat": loc.get("latitude"),
            "lng": loc.get("longitude"),
            "image": _best_image_url(e.get("images")),
        })

    return events

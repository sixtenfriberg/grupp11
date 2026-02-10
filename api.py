from flask import Flask, request, render_template, jsonify
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

from services.ticketmaster import fetch_events

app = Flask(__name__)


def _valid_date(s):
    """Returns YYYY-MM-DD or None if insufficient."""
    if not s:
        return None
    try:
        datetime.strptime(s, "%Y-%m-%d")
        return s
    except ValueError:
        return None


def _get_filters():
    """Gets filters from query params."""
    keyword = (request.args.get("keyword") or "").strip() or None
    start = _valid_date(request.args.get("start"))
    end = _valid_date(request.args.get("end"))
    size = request.args.get("size", default=50, type=int)

    # Om slutdatum är före startdatum, byt plats
    if start and end and end < start:
        start, end = end, start

    return keyword, start, end, size


@app.get("/")
def home():
    # Rendera sidan tom (ingen Ticketmaster-fetch här)
    return render_template(
        "index.html",
        events=[],
        keyword=None,
        start=None,
        end=None,
    )


@app.get("/api/events")
def api_events():
    """Handles the events and returns them in json format"""
    keyword, start, end, size = _get_filters()

    try:
        events = fetch_events(keyword=keyword, start=start, end=end, size=size)
    except Exception as e:
        print("fetch_events failed:", repr(e))
        events = []

    return jsonify(events)

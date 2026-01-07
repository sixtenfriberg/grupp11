from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv

load_dotenv()  # Ladda .env EN gång i appen

from services.ticketmaster import fetch_events

app = Flask(__name__)

# HTML-sida på / som renderar templates/index.html
@app.get("/")
def home():
    events = fetch_events(size=10)
    return render_template("index.html", events=events)

# API-endpoint som returnerar JSON
@app.get("/api/events")
def api_events():
    keyword = request.args.get("keyword")
    start = request.args.get("start")
    end = request.args.get("end")
    size = int(request.args.get("size", 20))

    lat = request.args.get("lat", type=float)
    lng = request.args.get("lng", type=float)
    radius = request.args.get("radius", default=10, type=float)

    events = fetch_events(
        keyword=keyword,
        start=start,
        end=end,
        size=size,
        lat=lat,
        lng=lng,
        radius_km=radius,
    )
    return jsonify(events)

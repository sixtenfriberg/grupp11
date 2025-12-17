from flask import Flask, request, jsonify
from dotenv import load_dotenv

load_dotenv()  # Ladda .env EN gång i appen

from services.ticketmaster import fetch_events

app = Flask(__name__)

@app.get("/api/events")
def api_events():
    keyword = request.args.get("keyword")
    start = request.args.get("start")  # ISO: 2025-12-01T00:00:00Z
    end = request.args.get("end")
    size = int(request.args.get("size", 20))
    
    lat = request.args.get("lat", type=float)
    lng = request.args.get("lng", type=float)
    radius = request.args.get("radius", default=10, type=float)

    events = fetch_events(keyword=keyword, start=start, end=end, size=size)
    return jsonify(events)

    


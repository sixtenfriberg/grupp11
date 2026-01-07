from flask import Flask, request, render_template, jsonify
from dotenv import load_dotenv

load_dotenv()

from services.ticketmaster import fetch_events

app = Flask(__name__)


@app.get("/")
def home():
    
    keyword = request.args.get("keyword") or None
    start = request.args.get("start") or None  
    end = request.args.get("end") or None      
    size = request.args.get("size", default=50, type=int)

    events = fetch_events(
        keyword=keyword,
        start=start,
        end=end,
        size=size,
    )

    return render_template(
        "index.html",
        events=events,
        keyword=keyword,
        start=start,
        end=end,
    )


@app.get("/api/events")
def api_events():
    keyword = request.args.get("keyword") or None
    start = request.args.get("start") or None
    end = request.args.get("end") or None
    size = request.args.get("size", default=50, type=int)

    events = fetch_events(
        keyword=keyword,
        start=start,
        end=end,
        size=size,
    )
    return jsonify(events)

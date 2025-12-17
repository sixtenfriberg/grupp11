from dotenv import load_dotenv
load_dotenv()

from services.ticketmaster import fetch_events

events = fetch_events(size=5)
print(f"Hittade {len(events)} events")
for ev in events:
    print(ev["localDate"], ev["localTime"], "-", ev["name"], "@", ev["venue"])

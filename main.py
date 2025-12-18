import os
from dotenv import load_dotenv
from api import app

load_dotenv()

print("API KEY:", os.getenv("TICKETMASTER_API_KEY"))

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True)

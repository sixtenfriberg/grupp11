import os
from dotenv import load_dotenv
from api import app

load_dotenv()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=True) 
    
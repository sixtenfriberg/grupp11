Grupp 11 - Eventtjänst

Detta projekt är en webbaserad applikation som låter användare söka efter evenemang baserat på plats och sökord. Applikationen hämtar data från externa API:er och presenterar resultaten på ett användarvänligt sätt.

Tekniker
- Python
- Flask
- HTML
- CSS
- JavaScript
- Externt API (Ticketmaster & Leafleet)

Installation

1. Klona projektets repository:
bash
git clone https://github.com/sixtenfriberg/grupp11.git
cd grupp11

2. Skapa och aktivera en virtuell miljö:
python -m venv venv
source venv/bin/activate   

3. Installera beroenden:
pip install -r requirements.txt

4. Skapa miljövariabel i form av .env med API nyckel
(Med detta format)
API_KEY=din_api_nyckel_här

5. Kör sedan main.py och sedan gå till localhost port 5001 
http://127.0.0.1:5001



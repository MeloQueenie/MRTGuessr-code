# MRTGuessr Backend

A simple Flask backend for the MRTGuessr Minecraft location guessing game.

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
python src/app.py
```

The server will start at `http://localhost:5000`
<!--
## API Endpoints

### GET `/api/tiles/<z>/<x>/<y>.png`
Proxy Leaflet map tiles to Dynmap's tile system. This endpoint converts standard Leaflet tile coordinates to Dynmap's coordinate system and fetches the tiles from the MRT Dynmap server.

**Example:** `http://localhost:5000/api/tiles/8/0/0.png`

**Response:** PNG tile image (256x256 or 128x128 depending on zoom)

**Note:** This handles the coordinate conversion between Leaflet's CRS.Simple (centered at 0,0) and Dynmap's tile naming scheme.

---

### GET `/api/panorama/<id>`
Get a panorama image by its ID.

**Example:** `http://localhost:5000/api/panorama/0`

**Response:** PNG image file

---

### GET `/api/round`
Get a random panorama ID for a new game round.

**Example:** `http://localhost:5000/api/round`

**Response:**
```json
{
  "panoramaId": 42
}
```

---

### POST `/api/guess`
Submit a player's guess and get the score.

**Example Request:**
```json
{
  "panoramaId": 42,
  "guessX": 100.5,
  "guessZ": 200.5
}
```

**Response:**
```json
{
  "distance": 150.5,
  "score": 4500,
  "actualX": 48.5,
  "actualZ": 214.5,
  "town": "Central City"
}
```

## How It Works

1. The server loads all valid panoramas from the CSV file when it starts
2. Your React frontend calls `/api/round` to start a new game and get a random panorama ID
3. The frontend displays the panorama by requesting it from `/api/panorama/<id>`
4. When the player makes a guess, the frontend sends the coordinates to `/api/guess`
5. The server calculates the distance and score based on how close the guess was

## Scoring System

- **Maximum score:** 5000 points (perfect guess)
- **Score formula:** 5000 × e^(-distance/1000)
- Score decreases exponentially as distance increases
- The further away your guess, the fewer points you get!
-->
from flask import Blueprint, jsonify, request
import random
import math
from data import get_panorama_data
from utils.scoreDist import calc_y

game_bp = Blueprint('game', __name__)

@game_bp.route("/api/round")
def get_round():
    """
    Get a random panorama for a new game round.
    Returns JSON with the panorama ID that the frontend will use.
    Example response: {"panoramaId": 42}
    """
    panorama_data = get_panorama_data()
    # Pick a random panorama from the available ones
    random_id = random.choice(list(panorama_data.keys()))

    return jsonify({
        'panoramaId': random_id
    })


@game_bp.route("/api/guess", methods=['POST'])
def submit_guess():
    """
    Handle a player's guess and calculate their score.
    Expects JSON body with:
    {
        "panoramaId": 42,
        "guessX": 100.5,
        "guessZ": 200.5
    }

    Returns JSON with distance and score:
    {
        "distance": 150.5,
        "score": 4500,
        "actualX": 48.5,
        "actualZ": 214.5,
        "town": "Central City"
    }
    """
    panorama_data = get_panorama_data()

    # Get the guess data from the request
    data = request.json
    panorama_id = data.get('panoramaId')
    guess_x = data.get('guessX')
    guess_z = data.get('guessZ')

    # Validate inputs
    if panorama_id is None or guess_x is None or guess_z is None:
        return jsonify({'error': 'Missing required fields'}), 400

    if panorama_id not in panorama_data:
        return jsonify({'error': 'Invalid panorama ID'}), 404

    # Get the actual location
    actual = panorama_data[panorama_id]
    actual_x = actual['x']
    actual_z = actual['z']

    # Calculate distance using Pythagorean theorem
    # Distance = sqrt((x2-x1)^2 + (z2-z1)^2)
    distance = math.sqrt((guess_x - actual_x)**2 + (guess_z - actual_z)**2)

    score = calc_y(distance)

    return jsonify({
        'distance': round(distance, 2),
        'score': score,
        'actualX': actual_x,
        'actualZ': actual_z,
        'town': actual['town']
    })

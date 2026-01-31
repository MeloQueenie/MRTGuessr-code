from flask import Blueprint, jsonify, request
import random
import math
from data import get_panorama_data
from utils.scoreDist import calc_y
from db import execute_query
from psycopg2.extras import Json

game_bp = Blueprint('game', __name__)

# -- Queries --
def db_get_total_score(game_uuid):
    result = execute_query(
        "SELECT SUM((guess_result->>'score')::int) AS total_score FROM games, jsonb_array_elements(guess_results) AS guess_result WHERE uuid = %s",
        (str(game_uuid),),
        fetch=True
    )
    return result['total_score'] or 0

# -- Routes --
@game_bp.route("/api/game/statistics")
def game_statistics():
    """
    Get game statistics: total panoramas and unique cities.
    Returns: {"totalPanoramas": number, "uniqueCities": number}
    """
    panorama_data = get_panorama_data()
    total_panoramas = len(panorama_data)
    unique_cities = len(set(p['town'] for p in panorama_data.values()))
    return jsonify({
        'totalPanoramas': total_panoramas,
        'uniqueCities': unique_cities
    })

@game_bp.route("/api/game/internal_panorama_data")
def internal_panorama_data():
    """
    Get internal panorama data for debugging.
    Returns: {"panoramaId": {"x": number, "z": number, "town": string}, ...}
    """
    panorama_data = get_panorama_data()
    return jsonify(panorama_data)


@game_bp.route("/api/game/start", methods=['POST'])
def start_game():
    """
    Start a new game and return a UUID.
    Returns: {"uuid": "550e8400-e29b-41d4-a716-446655440000"}
    """
    result = execute_query(
        "INSERT INTO games DEFAULT VALUES RETURNING uuid",
        fetch=True
    )
    return jsonify({'uuid': str(result['uuid'])})


@game_bp.route("/api/game/<uuid:game_uuid>/round", methods=['POST'])
def get_round(game_uuid):
    """
    Get current or new round for a game. Idempotent - returns same panorama if already set.
    Returns: {"panoramaId": 42, "roundNumber": 1, "totalScore": 12345}
    """
    result = execute_query(
        "SELECT round_number, current_panorama_id, created_at FROM games WHERE uuid = %s",
        (str(game_uuid),),
        fetch=True
    )

    total_score_result = db_get_total_score(game_uuid)

    if not result:
        return jsonify({'error': 'Game not found'}), 404

    panorama_id = result['current_panorama_id']
    if panorama_id is None:
        panorama_data = get_panorama_data()
        panorama_id = random.choice(list(panorama_data.keys()))
        execute_query(
            "UPDATE games SET current_panorama_id = %s WHERE uuid = %s",
            (panorama_id, str(game_uuid))
        )

    return jsonify({
        'panoramaId': panorama_id,
        'roundNumber': result['round_number'],
        'totalScore': total_score_result,
        'createdAt': result['created_at'].isoformat()
    })


@game_bp.route("/api/game/<uuid:game_uuid>/guess", methods=['POST'])
def submit_guess(game_uuid):
    """
    Submit a guess for a game round. Stores result and returns score.
    Expects: {"guessX": 100.5, "guessZ": 200.5}
    Returns: {"distance": 150.5, "score": 4500, "actualX": 48.5, "actualZ": 214.5, ...}
    """

    current_game_data = execute_query(
        "SELECT current_panorama_id, round_number FROM games WHERE uuid = %s",
        (str(game_uuid),),
        fetch=True
    )

    panorama_data = get_panorama_data()
    data = request.json
    panorama_id = current_game_data['current_panorama_id']
    guess_x = data.get('guessX')
    guess_z = data.get('guessZ')

    if panorama_id is None or guess_x is None or guess_z is None:
        return jsonify({'error': 'Missing required fields'}), 400

    if panorama_id not in panorama_data:
        return jsonify({'error': 'Invalid panorama ID'}), 404

    actual = panorama_data[panorama_id]
    distance = math.sqrt((guess_x - actual['x'])**2 + (guess_z - actual['z'])**2)
    score = calc_y(distance)

    guess_result = {
        'panoramaId': panorama_id,
        'distance': round(distance, 2),
        'score': score,
        'actualX': actual['x'],
        'actualZ': actual['z'],
        'guessX': guess_x,
        'guessZ': guess_z,
        'town': actual['town'],
        'roundNumber': current_game_data['round_number']
    }

    execute_query(
        """UPDATE games
           SET guess_results = guess_results || %s::jsonb,
               round_number = round_number + 1,
               current_panorama_id = NULL
           WHERE uuid = %s""",
        (Json([guess_result]), str(game_uuid))
    )

    # Mark completed at 5 rounds
    if current_game_data['round_number'] >= 5:
        execute_query(
            "UPDATE games SET completed_at = CURRENT_TIMESTAMP WHERE uuid = %s",
            (str(game_uuid),)
        )

    return jsonify(guess_result)


@game_bp.route("/api/game/<uuid:game_uuid>/results")
def get_results(game_uuid):
    """
    Get all guess results for a game.
    Returns: {"results": [...], "roundNumber": 5}
    """
    result = execute_query(
        "SELECT guess_results, round_number, created_at, completed_at FROM games WHERE uuid = %s",
        (str(game_uuid),),
        fetch=True
    )

    total_score_result = db_get_total_score(game_uuid)

    if not result:
        return jsonify({'error': 'Game not found'}), 404

    return jsonify({
        'results': result['guess_results'],
        'roundNumber': result['round_number'],
        'totalScore': total_score_result,
        'createdAt': result['created_at'].isoformat(),
        'completedAt': result['completed_at'].isoformat() if result['completed_at'] else None
    })

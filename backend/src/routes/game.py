from flask import Blueprint, jsonify, request
import random
import math
import requests
from data import get_panorama_data
from utils.scoreDist import calc_y
from db import execute_query
from psycopg2.extras import Json
from routes.auth import get_user_from_token
from config import DISCORD_WEBHOOK_URL

game_bp = Blueprint('game', __name__)

# -- Helper Functions --
def post_discord_webhook(message: str):
    if not DISCORD_WEBHOOK_URL:
        return

    data = {
        "content": message
    }
    try:
        response = requests.post(DISCORD_WEBHOOK_URL, json=data)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error posting to Discord webhook: {e}")

def send_game_results_discord(game_data):
    """
    Send game results to Discord webhook with an embed.
    game_data should contain: username, display_name, profile_picture, guess_results, total_score
    """
    if not DISCORD_WEBHOOK_URL:
        return

    # Build fields for each round
    fields = []
    for result in game_data.get('guess_results', []):
        round_num = result.get('roundNumber', '?')
        town = result.get('town', 'Unknown')
        score = result.get('score', 0)
        distance = result.get('distance', 0)

        fields.append({
            "name": f"Round {round_num}: {town}",
            "value": f"**{score:,}** points ({distance:.1f}m away)",
            "inline": False
        })
    total_score = game_data.get('total_score', 0)

    seconds = int(game_data.get("time_taken", 0))
    minutes, secs = divmod(seconds, 60)
    natural_time = f"{minutes}m {secs}s" if minutes else f"{secs}s"

    is_custom = game_data.get('is_custom', False)
    title = "MRTGuessr Custom Score Card" if is_custom else "MRTGuessr Score Card"
    description = f"Total score of **{total_score:,}** points in {natural_time}!"
    if is_custom:
        description += "\n- *Custom game* -"

    embed = {
        "author": {
            "name": game_data.get('display_name') or "Anonymous",
            "icon_url": game_data.get('profile_picture') or "https://mrtguessr.seshan.xyz/logo192.png"
        },
        "title": title,
        "url": f"https://mrtguessr.seshan.xyz/game/results/{game_data.get('game_uuid')}",
        "description": description,
        "color": 0xF97316 if is_custom else 0x34D399,  # Orange for custom, green for normal
        "fields": fields,
        "footer": {
            "text": "MRTGuessr"
        },
        "timestamp": game_data.get('completed_at', '')
    }

    webhook_data = {
        "embeds": [embed]
    }

    try:
        response = requests.post(DISCORD_WEBHOOK_URL, json=webhook_data)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error posting to Discord webhook: {e}")

# -- Queries --
def db_get_total_score(game_uuid):
    result = execute_query(
        "SELECT SUM((guess_result->>'score')::int) AS total_score FROM games, jsonb_array_elements(guess_results) AS guess_result WHERE uuid = %s",
        (str(game_uuid),),
        fetchone=True
    )
    return result['total_score'] or 0

def db_get_leaderboard(top_n=100, period='all_time'):
    # Determine the date filter based on period
    date_filter = ""
    if period == 'daily':
        date_filter = "AND completed_at >= CURRENT_DATE"
    elif period == 'weekly':
        date_filter = "AND completed_at >= DATE_TRUNC('week', CURRENT_DATE)"
    elif period == 'monthly':
        date_filter = "AND completed_at >= DATE_TRUNC('month', CURRENT_DATE)"
    elif period == 'yearly':
        date_filter = "AND completed_at >= DATE_TRUNC('year', CURRENT_DATE)"
    # For 'all_time', no additional filter needed

    results = execute_query(
        f"""SELECT u.display_name, u.username, u.profile_picture, g.total_score, g.created_at
           FROM (
               SELECT user_id, SUM((guess_result->>'score')::int) AS total_score, MIN(created_at) AS created_at
               FROM games, jsonb_array_elements(guess_results) AS guess_result
               WHERE completed_at IS NOT NULL
                 AND is_custom = FALSE
                 {date_filter}
               GROUP BY user_id
           ) g
           JOIN users u ON g.user_id = u.id
           ORDER BY g.total_score DESC, g.created_at ASC
           LIMIT %s
        """,
        (top_n,),
        fetchall=True
    )
    return results

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

@game_bp.route("/api/game/leaderboard")
def game_leaderboard():
    """
    Get the game leaderboard.
    Query params: period (daily, weekly, monthly, yearly, all_time) - defaults to all_time
    Returns: [{"displayName": string, "username": string, "profilePicture": string, "totalScore": number, "createdAt": string}, ...]
    """
    period = request.args.get('period', 'all_time')
    valid_periods = ['daily', 'weekly', 'monthly', 'yearly', 'all_time']

    if period not in valid_periods:
        return jsonify({'error': 'Invalid period. Must be one of: daily, weekly, monthly, yearly, all_time'}), 400

    leaderboard = db_get_leaderboard(period=period)
    return jsonify([
        {
            'displayName': row['display_name'],
            'username': row['username'],
            'profilePicture': row['profile_picture'],
            'totalScore': row['total_score'],
            'createdAt': row['created_at'].isoformat()
        }
        for row in leaderboard
    ])

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
    Expects: {
        "gameType": "NORMAL" | "MC_GUESS",
        "customOptions": {
            "rankFilter": ["Premier", "Governor"]  # Optional
        }
    }
    Returns: {"uuid": "...", "gameType": "...", "isCustom": bool}
    """
    data = request.json or {}
    game_type = data.get('gameType')
    custom_options = data.get('customOptions')

    # Validate game_type
    valid_game_types = ['NORMAL', 'MC_GUESS']
    if game_type not in valid_game_types:
        return jsonify({'error': f'Invalid game type. Must be one of: {", ".join(valid_game_types)}'}), 400

    # Determine if custom game
    is_custom = False
    custom_options_json = None

    if custom_options:
        rank_filter = custom_options.get('rankFilter', [])
        if rank_filter and len(rank_filter) > 0:
            is_custom = True
            custom_options_json = Json(custom_options)

    token = request.cookies.get('auth_token')
    user = get_user_from_token(token)
    print("Auth token:", token)
    print("Starting game for user:", user, "with game type:", game_type)
    user_id = user['id'] if user else None

    result = execute_query(
        """INSERT INTO games (user_id, game_type, custom_options, is_custom)
           VALUES (%s, %s, %s, %s) RETURNING uuid""",
        (user_id, game_type, custom_options_json, is_custom),
        fetchone=True
    )

    return jsonify({
        'uuid': str(result['uuid']),
        'gameType': game_type,
        'isCustom': is_custom
    })


@game_bp.route("/api/game/<uuid:game_uuid>/round", methods=['POST'])
def get_round(game_uuid):
    """
    Get current or new round for a game. Idempotent - returns same panorama if already set.
    Applies rank filtering if custom_options.rankFilter is set.
    Returns: {"panoramaId": 42, "roundNumber": 1, "totalScore": 12345}
    """
    result = execute_query(
        """SELECT round_number, current_panorama_id, created_at, game_type,
                  custom_options, is_custom
           FROM games WHERE uuid = %s""",
        (str(game_uuid),),
        fetchone=True
    )

    total_score_result = db_get_total_score(game_uuid)

    if not result:
        return jsonify({'error': 'Game not found'}), 404

    panorama_id = result['current_panorama_id']
    if panorama_id is None:
        panorama_data = get_panorama_data()

        # Apply rank filtering if custom options present
        custom_options = result.get('custom_options')
        if custom_options and 'rankFilter' in custom_options:
            rank_filter = custom_options['rankFilter']
            if rank_filter and len(rank_filter) > 0:
                # Filter panoramas by selected ranks
                filtered_panoramas = {
                    pid: pano for pid, pano in panorama_data.items()
                    if pano['rank'] in rank_filter
                }

                # Validate we have panoramas to select from
                if not filtered_panoramas:
                    return jsonify({
                        'error': 'No panoramas match the selected rank filters'
                    }), 400

                panorama_data = filtered_panoramas

        # Select random panorama from (possibly filtered) pool
        panorama_id = random.choice(list(panorama_data.keys()))
        execute_query(
            "UPDATE games SET current_panorama_id = %s WHERE uuid = %s",
            (panorama_id, str(game_uuid))
        )

    return jsonify({
        'panoramaId': panorama_id,
        'roundNumber': result['round_number'],
        'totalScore': total_score_result,
        'createdAt': result['created_at'].isoformat(),
        'gameType': result['game_type']
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
        fetchone=True
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
            "UPDATE games SET completed_at = CURRENT_TIMESTAMP, round_number = 5 WHERE uuid = %s",
            (str(game_uuid),)
        )

        # Fetch complete game data for Discord webhook
        game_results = execute_query(
            """SELECT g.guess_results, g.completed_at, g.user_id, g.is_custom,
                      u.display_name, u.username, u.profile_picture
               FROM games g
               LEFT JOIN users u ON g.user_id = u.id
               WHERE g.uuid = %s""",
            (str(game_uuid),),
            fetchone=True
        )

        time_taken = execute_query(
            """SELECT EXTRACT(EPOCH FROM (completed_at - created_at)) AS time_taken
               FROM games
               WHERE uuid = %s""",
            (str(game_uuid),),
            fetchone=True
        )

        if game_results:
            total_score = db_get_total_score(game_uuid)
            send_game_results_discord({
                'game_uuid': str(game_uuid),
                'username': game_results['username'],
                'display_name': game_results['display_name'],
                'profile_picture': game_results['profile_picture'],
                'guess_results': game_results['guess_results'],
                'total_score': total_score,
                'completed_at': game_results['completed_at'].isoformat() if game_results['completed_at'] else None,
                'time_taken': time_taken['time_taken'] if time_taken else None,
                'is_custom': game_results.get('is_custom', False)
            })

    return jsonify(guess_result)


@game_bp.route("/api/game/<uuid:game_uuid>/results")
def get_results(game_uuid):
    """
    Get all guess results for a game.
    Returns:
    {
        "results": [
            {"panoramaId": 42, "distance": 150.5, "score": 4500, "actualX": 48.5, "actualZ": 214.5, "guessX": 100.5, "guessZ": 200.5, "town": "TownName", "roundNumber": 1},
            ...
        ],
        "roundNumber": 5,
        "totalScore": 23000,
        "displayName": "PlayerOne",
        "username": "playerone123",
        "profilePicture": "https://example.com/profile.jpg",
        "createdAt": "...",
        "completedAt": "...",
        "gameType": "NORMAL"
    }
    """
    result = execute_query(
        """SELECT g.guess_results, g.round_number, g.created_at, g.completed_at, g.game_type,
                  g.is_custom, u.display_name, u.username, u.profile_picture
           FROM games g
           LEFT JOIN users u ON g.user_id = u.id
           WHERE g.uuid = %s""",
        (str(game_uuid),),
        fetchone=True
    )

    total_score_result = db_get_total_score(game_uuid)

    if not result:
        return jsonify({'error': 'Game not found'}), 404

    return jsonify({
        'results': result['guess_results'],
        'roundNumber': result['round_number'],
        'totalScore': total_score_result,
        'displayName': result['display_name'],
        'username': result['username'],
        'profilePicture': result['profile_picture'],
        'createdAt': result['created_at'].isoformat(),
        'completedAt': result['completed_at'].isoformat() if result['completed_at'] else None,
        'gameType': result['game_type'],
        'isCustom': result.get('is_custom', False)
    })

from flask import Blueprint, jsonify, request
from db import execute_query
from uuid import UUID
from routes.auth import get_user_from_token
from routes.game import db_get_total_score

user_bp = Blueprint('user', __name__)

def is_valid_uuid(value):
    """Check if a string is a valid UUID."""
    try:
        UUID(value)
        return True
    except (ValueError, AttributeError):
        return False

@user_bp.route("/api/user/<identifier>")
def get_user_profile(identifier):
    """
    Get user profile by username or UUID.
    Returns: {"uuid": "...", "username": "...", "displayName": "...", "description": "...", "profilePicture": "...", "createdAt": "..."}
    """
    # Determine if identifier is UUID or username
    if is_valid_uuid(identifier):
        query = """
            SELECT uuid, username, display_name, description, profile_picture, created_at
            FROM users
            WHERE uuid = %s
        """
        params = (identifier,)
    else:
        query = """
            SELECT uuid, username, display_name, description, profile_picture, created_at
            FROM users
            WHERE username = %s
        """
        params = (identifier,)

    result = execute_query(query, params, fetchone=True)

    if not result:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({
        'uuid': str(result['uuid']),
        'username': result['username'],
        'displayName': result['display_name'],
        'description': result['description'],
        'profilePicture': result['profile_picture'],
        'createdAt': result['created_at'].isoformat()
    })

@user_bp.route("/api/user/<identifier>", methods=['PATCH'])
def update_user_profile(identifier):
    """
    Update user profile. Only the authenticated user can update their own profile.
    Expects: {"description": "..."}
    Returns: Updated user profile
    """
    # Get authenticated user from token
    token = request.cookies.get('auth_token')
    authenticated_user = get_user_from_token(token)

    if not authenticated_user:
        return jsonify({'error': 'Unauthorized - please log in'}), 401

    # Get the target user profile
    if is_valid_uuid(identifier):
        query = """
            SELECT id, uuid, username
            FROM users
            WHERE uuid = %s
        """
        params = (identifier,)
    else:
        query = """
            SELECT id, uuid, username
            FROM users
            WHERE username = %s
        """
        params = (identifier,)

    target_user = execute_query(query, params, fetchone=True)

    if not target_user:
        return jsonify({'error': 'User not found'}), 404

    # Verify the authenticated user is updating their own profile
    if authenticated_user['id'] != target_user['id']:
        return jsonify({'error': 'Forbidden - you can only edit your own profile'}), 403

    # Get update data from request
    data = request.json
    description = data.get('description')

    if description is None:
        return jsonify({'error': 'Description is required'}), 400

    # Update the user's description
    update_query = """
        UPDATE users
        SET description = %s
        WHERE id = %s
        RETURNING uuid, username, display_name, description, profile_picture, created_at
    """
    updated_user = execute_query(update_query, (description, target_user['id']), fetchone=True)

    return jsonify({
        'uuid': str(updated_user['uuid']),
        'username': updated_user['username'],
        'displayName': updated_user['display_name'],
        'description': updated_user['description'],
        'profilePicture': updated_user['profile_picture'],
        'createdAt': updated_user['created_at'].isoformat()
    })

@user_bp.route("/api/user/<identifier>/games")
def get_user_games(identifier):
    """
    Get paginated list of games played by a user.
    Query params: page (default 1), limit (default 10, max 50)
    Returns: {"games": [...], "page": 1, "limit": 10, "total": 100}
    """
    # Get pagination params
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 10, type=int)

    # Validate params
    if page < 1:
        page = 1
    if limit < 1 or limit > 50:
        limit = 10

    offset = (page - 1) * limit

    # Get user ID
    if is_valid_uuid(identifier):
        user_query = "SELECT id FROM users WHERE uuid = %s"
        params = (identifier,)
    else:
        user_query = "SELECT id FROM users WHERE username = %s"
        params = (identifier,)

    user_result = execute_query(user_query, params, fetchone=True)

    if not user_result:
        return jsonify({'error': 'User not found'}), 404

    user_id = user_result['id']

    # Get total count and statistics - EXCLUDE CUSTOM GAMES
    count_result = execute_query(
        """SELECT COUNT(*) as total
           FROM games
           WHERE user_id = %s
             AND completed_at IS NOT NULL
             AND is_custom = FALSE
        """,
        (user_id,),
        fetchone=True
    )
    total = count_result['total']

    # Get overall statistics - EXCLUDE CUSTOM GAMES
    stats_result = execute_query(
        """SELECT
               SUM((guess_result->>'score')::int) as total_score,
               COUNT(DISTINCT g.uuid) as games_count
           FROM games g, jsonb_array_elements(g.guess_results) AS guess_result
           WHERE g.user_id = %s
             AND g.completed_at IS NOT NULL
             AND g.is_custom = FALSE
        """,
        (user_id,),
        fetchone=True
    )
    total_all_game_score = stats_result['total_score'] or 0
    avg_score = (total_all_game_score // stats_result['games_count']) if stats_result['games_count'] and stats_result['games_count'] > 0 else 0

    # Get games (includes custom games, but stats above exclude them)
    games_query = """
        SELECT uuid, created_at, completed_at, guess_results, round_number, is_custom
        FROM games
        WHERE user_id = %s AND completed_at IS NOT NULL
        ORDER BY completed_at DESC
        LIMIT %s OFFSET %s
    """
    games = execute_query(games_query, (user_id, limit, offset), fetchall=True)

    # Format response
    games_list = []
    for game in games:
        total_score = db_get_total_score(game['uuid'])
        games_list.append({
            'uuid': str(game['uuid']),
            'createdAt': game['created_at'].isoformat(),
            'completedAt': game['completed_at'].isoformat(),
            'totalScore': total_score,
            'roundsPlayed': len(game['guess_results']) if game['guess_results'] else 0,
            'isCustom': game.get('is_custom', False)
        })

    return jsonify({
        'games': games_list,
        'page': page,
        'limit': limit,
        'total': total,
        'stats': {
            'totalGames': total,
            'totalScore': total_all_game_score,
            'avgScore': avg_score
        }
    })
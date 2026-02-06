from flask import Blueprint, request, redirect, jsonify, make_response
import requests
import secrets
from config import (
    OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET, OAUTH_REDIRECT_URI,
    OAUTH_AUTHORIZATION_URL, OAUTH_TOKEN_URL, OAUTH_USER_URL
)
from db import get_connection
from psycopg2.extras import RealDictCursor

auth_bp = Blueprint('auth', __name__)

# -- Helper Functions --

def generate_session_token():
    """Generate a secure random session token."""
    return secrets.token_urlsafe(32)

def get_user_from_token(token) -> dict | None:
    """Get user from session token."""
    if not token:
        return None

    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(
        "SELECT id, uuid, username, display_name, description, profile_picture FROM users WHERE session_token = %s",
        (token,)
    )
    user = cur.fetchone()
    cur.close()
    return user

def create_or_update_user(oauth_id, username, display_name, profile_picture, session_token) -> dict:
    """Create or update a user in the database."""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    if display_name == "" or display_name is None:
        display_name = username

    cur.execute("""
        INSERT INTO users (oauth_id, username, display_name, profile_picture, session_token)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (oauth_id)
        DO UPDATE SET
            username = EXCLUDED.username,
            display_name = EXCLUDED.display_name,
            profile_picture = EXCLUDED.profile_picture,
            session_token = EXCLUDED.session_token
        RETURNING id, uuid, username, display_name, description, profile_picture
    """, (oauth_id, username, display_name, profile_picture, session_token))

    user = cur.fetchone()
    conn.commit()
    cur.close()
    return user

# -- Routes --

@auth_bp.route("/api/auth/login")
def login():
    """Redirect to OAuth2 provider for authentication."""
    params = {
        'client_id': OAUTH_CLIENT_ID,
        'redirect_uri': OAUTH_REDIRECT_URI,
        'response_type': 'code',
        'scope': 'identify'
    }
    auth_url = f"{OAUTH_AUTHORIZATION_URL}?{'&'.join(f'{k}={v}' for k, v in params.items())}"
    return redirect(auth_url)

@auth_bp.route("/api/auth/callback")
def callback():
    """Handle OAuth2 callback and set authentication cookie."""
    code = request.args.get('code')
    if not code:
        return jsonify({'error': 'No authorization code provided'}), 400

    # Exchange code for access token
    token_data = {
        'client_id': OAUTH_CLIENT_ID,
        'client_secret': OAUTH_CLIENT_SECRET,
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': OAUTH_REDIRECT_URI
    }

    token_response = requests.post(OAUTH_TOKEN_URL, data=token_data)
    if token_response.status_code != 200:
        return jsonify({'error': 'Failed to obtain access token'}), 400

    access_token = token_response.json().get('access_token')

    # Get user information
    headers = {'Authorization': f'Bearer {access_token}'}
    user_response = requests.get(OAUTH_USER_URL, headers=headers)
    if user_response.status_code != 200:
        return jsonify({'error': 'Failed to get user information'}), 400

    user_data = user_response.json()
    oauth_id = user_data['id']
    username = user_data['username']
    display_name = user_data.get('global_name', username)
    avatar = user_data.get('avatar')
    profile_picture = f"https://cdn.discordapp.com/avatars/{oauth_id}/{avatar}.png" if avatar else None

    # Generate session token
    session_token = generate_session_token()

    # Create or update user
    user = create_or_update_user(oauth_id, username, display_name, profile_picture, session_token)
    print("OAuth2 callback:", user)

    # Set cookie and redirect to frontend
    response = make_response(redirect('/'))
    response.set_cookie(
        'auth_token',
        session_token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite='Lax',
        max_age=30 * 24 * 60 * 60  # 30 days
    )
    return response

@auth_bp.route("/api/auth/logout", methods=['POST'])
def logout():
    """Clear session token from database and cookie."""
    token = request.cookies.get('auth_token')
    if token:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("UPDATE users SET session_token = NULL WHERE session_token = %s", (token,))
        conn.commit()
        cur.close()

    response = make_response(jsonify({'message': 'Logged out successfully'}))
    response.set_cookie('auth_token', '', expires=0, httponly=True)
    return response

@auth_bp.route("/api/auth/check")
def auth_check():
    """Check if user is authenticated and return user info."""
    token = request.cookies.get('auth_token')
    user = get_user_from_token(token)

    if not user:
        return jsonify({'authenticated': False}), 200

    return jsonify({
        'authenticated': True,
        'user': {
            'uuid': str(user['uuid']),
            'username': user['username'],
            'display_name': user['display_name'],
            'description': user['description'],
            'profile_picture': user['profile_picture']
        }
    }), 200

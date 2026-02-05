import os

# Path constants
ASSETS_PATH = os.path.join(os.path.dirname(__file__), '..', 'MRTGuessr-assets', 'mcPhotosphere')
GRAPHICS_PATH = os.path.join(os.path.dirname(__file__), '..', 'MRTGuessr-assets', 'graphics')
CSV_PATH = os.path.join(ASSETS_PATH, 'pan_locations.csv')
PANORAMA_FOLDER = os.path.join(ASSETS_PATH, 'pan')
CACHE_PATH = os.path.join(os.path.dirname(__file__), '..', 'cache')

CACHE_TTL_SECONDS = 168 * 60 * 60  # 1 week

# Dynmap configuration
DYNMAP_BASE = "https://dynmap.minecartrapidtransit.net/main/tiles/new/flat"

# Database configuration
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://localhost/mrtguessr')

# OAuth2 configuration
OAUTH_CLIENT_ID = os.environ.get('OAUTH_CLIENT_ID', '')
OAUTH_CLIENT_SECRET = os.environ.get('OAUTH_CLIENT_SECRET', '')
OAUTH_REDIRECT_URI = os.environ.get('OAUTH_REDIRECT_URI', 'http://localhost:5000/api/auth/callback')
OAUTH_AUTHORIZATION_URL = os.environ.get('OAUTH_AUTHORIZATION_URL', 'https://discord.com/api/oauth2/authorize')
OAUTH_TOKEN_URL = os.environ.get('OAUTH_TOKEN_URL', 'https://discord.com/api/oauth2/token')
OAUTH_USER_URL = os.environ.get('OAUTH_USER_URL', 'https://discord.com/api/users/@me')

print(f"Using database URL: {DATABASE_URL}")
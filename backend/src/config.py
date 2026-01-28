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

print(f"Using database URL: {DATABASE_URL}")
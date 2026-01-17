import os

# Path constants
ASSETS_PATH = os.path.join(os.path.dirname(__file__), '..', 'MRTGuessr-assets', 'mcPhotosphere')
GRAPHICS_PATH = os.path.join(os.path.dirname(__file__), '..', 'MRTGuessr-assets', 'graphics')
CSV_PATH = os.path.join(ASSETS_PATH, 'pan_locations.csv')
PANORAMA_FOLDER = os.path.join(ASSETS_PATH, 'pan')
CACHE_PATH = os.path.join(os.path.dirname(__file__), '..', 'cache')

CACHE_TTL_SECONDS = 24 * 60 * 60  # 24 hours

# Dynmap configuration
DYNMAP_BASE = "https://dynmap.minecartrapidtransit.net/main/tiles/new/flat"


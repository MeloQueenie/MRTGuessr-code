from flask import Blueprint, Response, abort
import math
import requests
import os
import time
from config import DYNMAP_BASE, CACHE_PATH, CACHE_TTL_SECONDS

tiles_bp = Blueprint('tiles', __name__)



@tiles_bp.route("/api/tiles/<int(signed=True):z>/<int(signed=True):x>/<int(signed=True):y>.png")
def dynmap_tile(z, x, y):
    """
    Based on https://github.com/MRT-Map/map/blob/main/src/map.js
    Converts standard Leaflet tile coordinates to Dynmap's tile naming scheme.

    Original JS implementation used plain L.CRS.Simple with these transforms:
    - Zcoord = 2 ** (8 - coords.z)
    - Xcoord = coords.x * 1
    - Ycoord = coords.y * -1
    - Tiles grouped in 32x32 blocks
    """

    # replication of the original getTileUrl logic
    z_coord = 2 ** (8 - z)
    x_coord = x
    y_coord = -y

    # Calculate tile group (32x32 tiles per group)\
    group_x = math.floor((x_coord * z_coord) / 32)
    group_y = math.floor((y_coord * z_coord) / 32)
    
    # Calculate tile number within the group
    number_in_group_x = math.floor(x_coord * z_coord)
    number_in_group_y = math.floor(y_coord * z_coord)

    # Build zoom prefix string
    zzz = ""
    for i in range(8, z, -1):
        zzz += "z"
    if zzz:
        zzz += "_"

    group_dir = f"{group_x}_{group_y}"
    filename = f"{zzz}{number_in_group_x}_{number_in_group_y}.png"

    tile_url = f"{DYNMAP_BASE}/{group_dir}/{filename}"

    cache_dir = os.path.join(CACHE_PATH, group_dir)
    cache_file = os.path.join(cache_dir, filename)

    # ---- Serve valid cached tile ----
    if os.path.exists(cache_file):
        age = time.time() - os.path.getmtime(cache_file)
        if age < CACHE_TTL_SECONDS:
            with open(cache_file, "rb") as f:
                return Response(f.read(), mimetype="image/png")

    # ---- Fetch from Dynmap ----
    try:
        response = requests.get(tile_url, timeout=10)
        if response.status_code != 200:
            abort(404)

        os.makedirs(cache_dir, exist_ok=True)

        with open(cache_file, "wb") as f:
            f.write(response.content)

        return Response(response.content, mimetype="image/png")

    except requests.RequestException:
        abort(404)

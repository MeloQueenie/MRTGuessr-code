from flask import Blueprint, Response, abort
import math
import requests
from config import DYNMAP_BASE

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
    x_coord = x * 1
    y_coord = y * -1

    # Calculate tile group (32x32 tiles per group)
    group_x = math.floor((x_coord * z_coord) / 32)
    group_y = math.floor((y_coord * z_coord) / 32)

    # Calculate tile number within the group
    number_in_group_x = math.floor(x_coord * z_coord)
    number_in_group_y = math.floor(y_coord * z_coord)

    # Build zoom prefix string
    zzz = ""
    for i in range(8, z, -1):
        zzz += "z"
    if len(zzz) != 0:
        zzz += "_"

    # Construct Dynmap URL
    tile_url = f"{DYNMAP_BASE}/{group_x}_{group_y}/{zzz}{number_in_group_x}_{number_in_group_y}.png"

    print(f"Tile: z={z}, x={x}, y={y} -> {tile_url}")

    try:
        response = requests.get(tile_url, timeout=10)
        if response.status_code == 200:
            return Response(response.content, mimetype='image/png')
        else:
            print("  -> Dynmap returned 404")
            abort(404)
    except requests.RequestException as e:
        print(f"  -> Error: {e}")
        abort(404)

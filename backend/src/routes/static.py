from flask import Blueprint, send_file, jsonify
import os
from config import GRAPHICS_PATH

static_bp = Blueprint('static', __name__)

@static_bp.route("/graphics/<path:filename>")
def serve_graphics(filename):
    """
    Serve static graphic files from the assets/graphics folder.
    Example: /graphics/icon.png serves assets/graphics/icon.png
    """
    filepath = os.path.join(GRAPHICS_PATH, filename)

    # Check if file exists
    if not os.path.exists(filepath):
        return jsonify({'error': 'Graphic file not found'}), 404

    return send_file(filepath)

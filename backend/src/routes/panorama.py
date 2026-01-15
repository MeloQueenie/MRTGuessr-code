from flask import Blueprint, send_file, jsonify
import os
from config import PANORAMA_FOLDER
from data import get_panorama_data

panorama_bp = Blueprint('panorama', __name__)

@panorama_bp.route("/api/panorama/<int:panorama_id>")
def get_panorama(panorama_id):
    """
    Serve a panorama image by its ID.
    Example: /api/panorama/0 returns panorama_0.png
    """
    panorama_data = get_panorama_data()

    # Check if the panorama exists
    if panorama_id not in panorama_data:
        return jsonify({'error': 'Panorama not found'}), 404

    # Build the file path
    filename = f"panorama_{panorama_id}.png"
    filepath = os.path.join(PANORAMA_FOLDER, filename)

    # Check if file exists
    if not os.path.exists(filepath):
        return jsonify({'error': 'Panorama image file not found'}), 404

    # Send the image file
    return send_file(filepath, mimetype='image/png')

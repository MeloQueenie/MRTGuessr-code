from flask import Blueprint, request, send_file, jsonify
import numpy as np
from PIL import Image
import py360convert
import io
import requests

service_bp = Blueprint('service', __name__)

@service_bp.route("/api/service/panorama_convert", methods=['POST'])
def convert_cubemap_to_panorama():
    """
    Convert 6 cubemap faces to a 360° equirectangular panorama.

    Expects multipart/form-data with 6 PNG files named:
    - face_0 (Front)
    - face_1 (Right)
    - face_2 (Back)
    - face_3 (Left)
    - face_4 (Up)
    - face_5 (Down)

    Returns: A PNG image of the 360° panorama (4096x2048)
    """

    # Check if all 6 faces are provided
    required_faces = ['face_0', 'face_1', 'face_2', 'face_3', 'face_4', 'face_5']

    if not all(face in request.files for face in required_faces):
        return jsonify({
            'error': 'Missing face images',
            'required': required_faces,
            'provided': list(request.files.keys())
        }), 400

    try:
        # Load the 6 faces from the uploaded files
        faces = {}
        face_mapping = {
            'face_0': 'F',  # Front
            'face_1': 'R',  # Right
            'face_2': 'B',  # Back
            'face_3': 'L',  # Left
            'face_4': 'U',  # Up
            'face_5': 'D'   # Down
        }

        for face_key, face_label in face_mapping.items():
            file = request.files[face_key]

            # Validate it's a PNG file
            if not file.filename.lower().endswith('.png'):
                return jsonify({
                    'error': f'{face_key} must be a PNG file',
                    'filename': file.filename
                }), 400

            # Read the image
            img = Image.open(file.stream)
            faces[face_label] = np.array(img)

        # Convert cubemap faces to equirectangular panorama
        # Output size: 4096x2048 (2:1 aspect ratio)
        panorama = py360convert.c2e(faces, h=2048, w=4096, cube_format='dict')

        # Convert numpy array back to PIL Image
        panorama_image = Image.fromarray(panorama)

        # Save to BytesIO buffer
        img_io = io.BytesIO()
        panorama_image.save(img_io, 'PNG')
        img_io.seek(0)

        return send_file(
            img_io,
            mimetype='image/png',
            as_attachment=True,
            download_name='panorama.png'
        )

    except Exception as e:
        return jsonify({
            'error': 'Failed to process panorama',
            'details': str(e)
        }), 500

@service_bp.route("/api/service/player_face/<username>", methods=['GET'])
def get_player_face(username):
    """
    Fetch a Minecraft player's skin from Mojang and extract their face.

    Args:
        username: The Minecraft player's username

    Returns: A PNG image of the player's face (8x8 pixels, scaled up)
    """
    try:
        # Step 1: Get the player's UUID from Mojang API
        uuid_response = requests.get(f'https://api.mojang.com/users/profiles/minecraft/{username}')
        if uuid_response.status_code != 200:
            return jsonify({
                'error': 'Player not found',
                'username': username
            }), 404

        player_data = uuid_response.json()
        player_uuid = player_data['id']

        # Step 2: Get the player's profile with skin data
        profile_response = requests.get(f'https://sessionserver.mojang.com/session/minecraft/profile/{player_uuid}')
        if profile_response.status_code != 200:
            return jsonify({
                'error': 'Failed to fetch player profile',
                'username': username
            }), 500

        profile_data = profile_response.json()

        # Step 3: Decode the base64 texture data
        import base64
        import json

        textures_encoded = None
        for prop in profile_data.get('properties', []):
            if prop['name'] == 'textures':
                textures_encoded = prop['value']
                break

        if not textures_encoded:
            return jsonify({
                'error': 'No texture data found',
                'username': username
            }), 404

        textures_decoded = base64.b64decode(textures_encoded)
        textures_data = json.loads(textures_decoded)

        skin_url = textures_data.get('textures', {}).get('SKIN', {}).get('url')
        if not skin_url:
            return jsonify({
                'error': 'No skin URL found',
                'username': username
            }), 404

        # Step 4: Download the skin image
        skin_response = requests.get(skin_url)
        if skin_response.status_code != 200:
            return jsonify({
                'error': 'Failed to download skin',
                'username': username
            }), 500

        # Step 5: Load the skin image and extract the face
        skin_image = Image.open(io.BytesIO(skin_response.content))

        # The face is at coordinates (8, 8) with size 8x8
        # There's also an overlay layer at (40, 8) with size 8x8
        face = skin_image.crop((8, 8, 16, 16))
        overlay = skin_image.crop((40, 8, 48, 16))

        # Composite the overlay on top of the face (if overlay has transparency)
        face_with_overlay = face.copy()
        face_with_overlay.paste(overlay, (0, 0), overlay if overlay.mode == 'RGBA' else None)

        # Scale up the face to make it more visible (8x8 -> 64x64)
        face_scaled = face_with_overlay.resize((64, 64), Image.NEAREST)

        # Step 6: Save to BytesIO buffer and return
        img_io = io.BytesIO()
        face_scaled.save(img_io, 'PNG')
        img_io.seek(0)

        return send_file(
            img_io,
            mimetype='image/png',
            as_attachment=False,
            download_name=f'{username}_face.png'
        )

    except requests.exceptions.RequestException as e:
        return jsonify({
            'error': 'Network error while fetching skin',
            'details': str(e)
        }), 500
    except Exception as e:
        return jsonify({
            'error': 'Failed to process player face',
            'details': str(e)
        }), 500

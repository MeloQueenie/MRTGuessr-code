from flask import Blueprint, request, send_file, jsonify
import numpy as np
from PIL import Image
import py360convert
import io

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

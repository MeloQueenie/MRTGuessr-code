from flask import Blueprint

health_bp = Blueprint('health', __name__)

@health_bp.route("/health")
def health_check():
    return "OK"

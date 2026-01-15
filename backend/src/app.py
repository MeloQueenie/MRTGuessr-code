# MRTGuessr Backend - Flask Application
# Copyright (C) 2026 Seshan Ravikumar

# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.

# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

from flask import Flask
from flask_cors import CORS

from data import load_panoramas

from routes.health import health_bp
from routes.game import game_bp
from routes.panorama import panorama_bp
from routes.tiles import tiles_bp
from routes.static import static_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(health_bp)
app.register_blueprint(game_bp)
app.register_blueprint(panorama_bp)
app.register_blueprint(tiles_bp)
app.register_blueprint(static_bp)

load_panoramas()

if __name__ == '__main__':
    # Run the Flask app in debug mode
    # Access it at http://localhost:5000
    app.run(debug=True, port=5000)

# app.py - Flask application with CORS and static file serving
# This file contains the Python/Flask glue layer between C++ backend and React frontend

from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
import os

# Initialize Flask with paths to React build folder
app = Flask(__name__, 
            static_folder='../visualizer/dist',
            template_folder='../visualizer/dist')

# Enable CORS for all routes (allows React dev server to communicate with Flask)
CORS(app)

@app.route('/')
def serve_react_app():
    """Serve the main React application"""
    return send_from_directory(app.template_folder, 'index.html')

@app.route('/<path:path>')
def serve_static_files(path):
    """Serve static files (JS, CSS, images, etc.) from React build"""
    try:
        return send_from_directory(app.static_folder, path)
    except:
        # If file not found, return index.html (for client-side routing)
        return send_from_directory(app.template_folder, 'index.html')

@app.route('/api/save', methods=['POST'])
def save_model_data():
    """
    API endpoint to save model training data
    Accepts JSON data from the frontend and returns success message
    """
    try:
        # Get JSON data from request
        data = request.get_json()
        
        # TODO: Implement actual save logic here
        # For now, this is a stub that accepts the data
        print(f"Received data to save: {data}")
        
        # Return success response
        return jsonify({
            'success': True,
            'message': 'Data saved successfully',
            'received_keys': list(data.keys()) if data else []
        }), 200
        
    except Exception as e:
        # Return error response
        return jsonify({
            'success': False,
            'message': f'Error saving data: {str(e)}'
        }), 400

if __name__ == '__main__':
    # NOTE: debug=True is for development only. Set to False in production.
    # Port 5000 as specified in project plan
    app.run(debug=True, port=5000, host='0.0.0.0')
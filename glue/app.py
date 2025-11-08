# app.py - Flask application placeholder
# This file will contain the Python/Flask glue layer between C++ backend and React frontend

from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return "ML Visualizer - Flask Glue Layer"

if __name__ == '__main__':
    # NOTE: debug=True is for development only. Set to False in production.
    app.run(debug=True)

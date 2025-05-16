from flask import Flask, jsonify, render_template
from backend.generate_leaderboard import get_leaderboard_data

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/leaderboard")
def leaderboard():
    data = get_leaderboard_data()
    return jsonify(data)

if __name__ == "__main__":
    app.run(debug=True)
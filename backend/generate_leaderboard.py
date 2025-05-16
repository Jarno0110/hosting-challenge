from backend.strava import get_leaderboard_data as strava_data

def get_leaderboard_data():
    # Aggregiere die Daten aus strava.py
    import os
    import json
    leaderboard = []
    leaderboard_path = os.path.join(os.path.dirname(__file__), '../data/leaderboard.json')
    if not os.path.exists(leaderboard_path):
        return []
    with open(leaderboard_path, 'r') as f:
        data = json.load(f)
        for name, stats in data.items():
            leaderboard.append({
                'name': name.capitalize(),
                'distance': stats['distance'],
                'moving_time': stats['time'],
                'count': stats['count']
            })
    # Sortiere nach Distanz absteigend
    leaderboard.sort(key=lambda x: x['distance'], reverse=True)
    return leaderboard
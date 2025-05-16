import requests
import urllib3
import json
import os
from dotenv import load_dotenv
import datetime
import time

load_dotenv()
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def get_athlete_access_token(clientid, clientsecret, refresh_token):
    """
    Fetches the current Strava API access token
    :clientid: Strava Athlete Client ID
    :clientsecret: Strava Client Secret (für alle Athleten gleich)
    :refresh_token: Strava Athlete Refresh Token
    :return: Strava Access token
    """
    # Urls for Strava API
    auth_url = "https://www.strava.com/oauth/token"

    # payload for API
    payload = {
        'client_id': clientid,
        'client_secret': clientsecret,
        'refresh_token': refresh_token,
        'grant_type': 'refresh_token',
        'f': 'json'
    }

    # get access token because it is only valid for 6h
    res = requests.post(auth_url, data=payload, verify=False)
    return res.json()['access_token']

def date_to_timestamp(date_str, format="%d-%m-%Y"):
    """
    Konvertiert ein Datum in einen Unix-Timestamp
    
    date_str: Datum als String
    format: Format des Datums (Standard: "DD-MM-YYYY")
             "%d-%m-%Y" für DD-MM-YYYY
             "%Y-%m-%d" für YYYY-MM-DD
    """
    dt = datetime.datetime.strptime(date_str, format)
    return int(time.mktime(dt.timetuple()))

def transform_activity(activity):
    """
    Transform the activity data to a more usable format
    :param activity: Activity data from Strava API
    :return: Transformed activity data
    """
    # Transformations
    activity['distance'] = round(activity['distance'] / 1000, 2)  # Convert distance to km
    activity['average_speed'] = round(activity['average_speed'] * 3.6, 2)  # Convert m/s to km/h
    activity['max_speed'] = round(activity['max_speed'] * 3.6, 2)  # Convert m/s to km/h
    activity['average_heartrate'] = int(activity['average_heartrate']) if 'average_heartrate' in activity else None
    activity['max_heartrate'] = int(activity['max_heartrate']) if 'max_heartrate' in activity else None
    return activity

def fetch_athlete_activities(athlete_access_token, name, before=None, after=None):
    """
    Fetches the activities in a specific time range of the athlete and saves them in a json file
    :param athlete_access_token: OAuth2 Access Token des Athleten
    :param name: Name des Athleten
    :param before: DD-MM-YYYY format for activities before this time
    :param after: DD-MM-YYYY format for activities after this time
    :return: None
    """
    activity_url = "https://www.strava.com/api/v3/athlete/activities"
    
    # if before and after are given, convert them to timestamps and add them to the URL
    if before and after:
        activity_url = f"{activity_url}?before={date_to_timestamp(before)}&after={date_to_timestamp(after)}"
    elif before:
        activity_url = f"{activity_url}?before={date_to_timestamp(before)}"
    elif after:
        activity_url = f"{activity_url}?after={date_to_timestamp(after)}"

    header = {'Authorization': f'Bearer {athlete_access_token}'}
    req_page_num = 1
    activities = []

    while True:
        param = {'per_page': 200, 'page': req_page_num}
        data = requests.get(activity_url, headers=header, params=param, verify=False).json()
        if len(data) == 0:
            break

        activities.extend([transform_activity(act) for act in data])
        req_page_num += 1

    # Save all fetched activities, overwriting any existing data
    os.makedirs('./data', exist_ok=True)
    with open(f'./data/{name}_activities.json', 'w') as f:
        json.dump(activities, f, indent=4)
        
    print(f"Fetched {len(activities)} activities.")

def transform_seconds_to_time(seconds):
    """
    Transforms seconds to a time string
    :param seconds: Seconds to transform
    :return: Time string in the format HH:MM:SS
    """
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    seconds = seconds % 60
    return f"{hours:02}:{minutes:02}:{seconds:02}"

def aggregate_activities():
    """
    Aggregates the activities data
    :return: None
    """
    # Load all activities from the data directory
    leaderboard = {
        'jarno': {
            'time': '',
            'count': 0,
            'distance': 0,
            'moving_time': 0
        },
        'haval': {
            'time': '',
            'count': 0,
            'distance': 0,
            'moving_time': 0
        },
        'jean': {
            'time': '',
            'count': 0,
            'distance': 0,
            'moving_time': 0,
        }
    }
    for filename in os.listdir('./data'):
        if filename.endswith('_activities.json'):
            with open(f'./data/{filename}', 'r') as f:
                # sum distance, sum moving_time, count of activities
                name = filename.split('_')[0]
                data = json.load(f)
                leaderboard[name]['count'] = len(data)
                for activity in data:
                    leaderboard[name]['distance'] += activity['distance']
                    leaderboard[name]['moving_time'] += activity['moving_time']
                leaderboard[name]['distance'] = round(leaderboard[name]['distance'], 2)
                leaderboard[name]['time'] = transform_seconds_to_time(leaderboard[name]['moving_time'])

    # Save the aggregated data
    with open('./data/leaderboard.json', 'w') as f:
        json.dump(leaderboard, f, indent=4)

    print(f"Aggregated {sum(leaderboard[name]['count'] for name in leaderboard)} activities.")
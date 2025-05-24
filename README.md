# hosting-challenge
Challenge app for monthly leaderboard of specific metrics from Strava

## Doku links
Icons: https://tabler.io/icons<br>
Tailwind CSS: https://tailwindcss.com/docs

# Lokales Testen
1. ```wrangler dev``` im cloudflare-worker ordner ausführen
2. falls neue api routen erstellt, dann in index.html die routen als ```"http://localhost:8787/api/..."``` einstellen
3. lokalen webserver mit ```python3 -m http.server 8000``` starten
4. localhost:8000 im Browser öffnen
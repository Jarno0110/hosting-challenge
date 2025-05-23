import { saveActivitiesToKV, loadActivitiesFromKV, loadAllActivities, saveLeaderboardToKV, loadLeaderboardFromKV, loadDatesFromKV, saveDatesToKV } from "./api/kv";
import { aggregateActivities } from "./api/leaderboard";
import { fetchAthleteActivities, getAthleteAccessToken } from "./api/strava";

export interface Env {
  ACTIVITIES_KV: any; // Typisierung für Cloudflare KVNamespace ("any" für Kompatibilität)
  // Optionale Secrets als string, dynamisch per Indexzugriff
  [key: string]: any;
}

const users = ["jarno", "haval", "jean", "maria", "cindy"];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    // Leaderboard-API
    if (url.pathname === "/api/leaderboard") {
      // Erst aus KV laden, dann ggf. live aggregieren und speichern
      let sorted;
      const cached = await loadLeaderboardFromKV(env);
      if (cached) {
        sorted = cached;
      } else {
        const activitiesByUser = await loadAllActivities(env, users);
        const leaderboard = aggregateActivities(activitiesByUser);
        sorted = Object.entries(leaderboard)
          .map(([name, stats]) => ({ name, ...(stats as { moving_time: number }) }))
          .filter(entry => typeof entry.moving_time === "number")
          .sort((a, b) => b.moving_time - a.moving_time);
        await saveLeaderboardToKV(env, sorted);
      }
      return new Response(JSON.stringify(sorted), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
        }
      });
    }
    // Aktivitäten für einen User aktualisieren (z.B. POST /api/update?user=jarno)
    if (url.pathname === "/api/update" && request.method === "POST") {
      const user = url.searchParams.get("user");
      if (!user || !users.includes(user)) {
        return new Response("Invalid user", { status: 400 });
      }
      // Strava-Credentials dynamisch aus env
      const clientId = env[`jarno_id`];
      const clientSecret = env["STRAVA_CLIENT_SECRET"];
      const refreshToken = env[`${user.toLowerCase()}_refresh_token`];
      if (!clientId || !clientSecret || !refreshToken) {
        return new Response("Missing Strava credentials", { status: 500 });
      }
      const accessToken = await getAthleteAccessToken(clientId, clientSecret, refreshToken);
      const { start, end } = await loadDatesFromKV(env);
      const activities = await fetchAthleteActivities(accessToken, start, end);
      await saveActivitiesToKV(env, user, activities);
      // Nach dem Speichern: Leaderboard neu aggregieren und speichern
      const activitiesByUser = await loadAllActivities(env, users);
      const leaderboard = aggregateActivities(activitiesByUser);
      const sorted = Object.entries(leaderboard)
        .map(([name, stats]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          ...(stats as { moving_time: number })
        }))
        .filter(entry => typeof entry.moving_time === "number")
        .sort((a, b) => b.moving_time - a.moving_time);
      await saveLeaderboardToKV(env, sorted);
      return new Response(JSON.stringify({ ok: true, count: activities.length }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
        }
      });
    }

    if (url.pathname === '/api/challenge-dates') {
      if (request.method === 'GET') {
        const { start, end } = await loadDatesFromKV(env);
        return new Response(JSON.stringify({ start, end }), {
          headers: {
            'Content-Type': 'application/json',
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
          }
        })
      }
      if (request.method === 'POST') {
        const { start, end } = await request.json();
        await saveDatesToKV(env, {
          'start': start,
          'end': end
        })
        return new Response(JSON.stringify({ ok: true }), {
          headers: { 
            'Content-Type': 'application/json',
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
          }
        })
      }
    }

    // CORS Preflight für OPTIONS-Requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }
    return new Response("Not found", { status: 404 });
  }
};

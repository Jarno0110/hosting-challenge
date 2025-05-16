// Strava API Funktionen
export async function getAthleteAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
  const authUrl = "https://www.strava.com/oauth/token";
  const payload = {
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
    f: "json"
  };
  const res = await fetch(authUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  return data.access_token;
}

export function dateToTimestamp(dateStr: string, format = "DD-MM-YYYY"): number {
  // Nur "DD-MM-YYYY" und "YYYY-MM-DD" werden unterstützt
  let dt: Date;
  if (format === "DD-MM-YYYY") {
    const [d, m, y] = dateStr.split("-").map(Number);
    dt = new Date(y, m - 1, d);
  } else {
    dt = new Date(dateStr);
  }
  return Math.floor(dt.getTime() / 1000);
}

export function transformActivity(activity: any): any {
  return {
    ...activity,
    distance: Math.round((activity.distance / 1000) * 100) / 100,
    average_speed: Math.round(activity.average_speed * 3.6 * 100) / 100,
    max_speed: Math.round(activity.max_speed * 3.6 * 100) / 100,
    average_heartrate: activity.average_heartrate ? Math.round(activity.average_heartrate) : null,
    max_heartrate: activity.max_heartrate ? Math.round(activity.max_heartrate) : null
  };
}

export async function fetchAthleteActivities(accessToken: string, before?: string, after?: string): Promise<any[]> {
  let url = "https://www.strava.com/api/v3/athlete/activities";
  const params = [];
  if (before) params.push(`before=${dateToTimestamp(before)}`);
  if (after) params.push(`after=${dateToTimestamp(after)}`);
  // Basis-URL mit Query-Params
  if (params.length > 0) {
    url += `?${params.join("&")}`;
  }
  let page = 1;
  let activities: any[] = [];
  while (true) {
    // Per-Page und Page-Parameter korrekt anhängen
    const pageUrl = url + (url.includes('?') ? '&' : '?') + `per_page=200&page=${page}`;
    const res = await fetch(pageUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    activities = activities.concat(data.map(transformActivity));
    page++;
  }
  return activities;
}

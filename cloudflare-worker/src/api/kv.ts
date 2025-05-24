// Cloudflare Worker KV-Helper für Aktivitäten
// Diese Datei kapselt die Speicherung und das Laden von Aktivitäten pro User

export async function saveActivitiesToKV(env: any, user: string, activities: any[]): Promise<void> {
  if (!env.ACTIVITIES_KV) throw new Error("KV Namespace ACTIVITIES_KV nicht gebunden");
  await env.ACTIVITIES_KV.put(`${user}_activities`, JSON.stringify(activities));
}

export async function loadActivitiesFromKV(env: any, user: string): Promise<any[]> {
  if (!env.ACTIVITIES_KV) throw new Error("KV Namespace ACTIVITIES_KV nicht gebunden");
  const data = await env.ACTIVITIES_KV.get(`${user}_activities`);
  return data ? JSON.parse(data) : [];
}

export async function loadAllActivities(env: any, users: string[]): Promise<Record<string, any[]>> {
  const result: Record<string, any[]> = {};
  for (const user of users) {
    result[user] = await loadActivitiesFromKV(env, user);
  }
  return result;
}

export async function saveLeaderboardToKV(env: any, leaderboard: any): Promise<void> {
  if (!env.ACTIVITIES_KV) throw new Error("KV Namespace ACTIVITIES_KV nicht gebunden");
  await env.ACTIVITIES_KV.put("leaderboard", JSON.stringify(leaderboard));
}

export async function loadLeaderboardFromKV(env: any): Promise<any | null> {
  if (!env.ACTIVITIES_KV) throw new Error("KV Namespace ACTIVITIES_KV nicht gebunden");
  const data = await env.ACTIVITIES_KV.get("leaderboard");
  return data ? JSON.parse(data) : null;
}

export async function saveDatesToKV(env: any, dates: Record<string, string>): Promise<void> {
  if (!env.ACTIVITIES_KV) throw new Error("KV Namespace ACTIVITIES_KV nicht gebunden");
  for (const [key, value] of Object.entries(dates)) {
    await env.ACTIVITIES_KV.put(`${key}_date`, value);
  }
}

export async function loadDatesFromKV(env: any): Promise<Record<string, string>> {
  if (!env.ACTIVITIES_KV) throw new Error("KV Namespace ACTIVITIES_KV nicht gebunden");
  const start = await env.ACTIVITIES_KV.get("start_date");
  const end = await env.ACTIVITIES_KV.get("end_date");
  return { start, end };
}

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

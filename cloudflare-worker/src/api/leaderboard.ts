import { transformSecondsToTime } from "../utils/time";

// Aggregiert Aktivitäten für ein Leaderboard (Mock, da keine persistente Speicherung)
export function aggregateActivities(activitiesByUser: Record<string, any[]>): any {
  const leaderboard: Record<string, any> = {};
  for (const [name, activities] of Object.entries(activitiesByUser)) {
    let distance = 0;
    let moving_time = 0;
    for (const activity of activities) {
      distance += activity.distance;
      moving_time += activity.moving_time;
    }
    leaderboard[name] = {
      time: transformSecondsToTime(moving_time),
      count: activities.length,
      distance: Math.round(distance * 100) / 100,
      moving_time
    };
  }
  return leaderboard;
}

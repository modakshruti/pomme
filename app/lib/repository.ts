import { env } from "cloudflare:workers";
import type { DayState, Settings } from "./schemas";

export const emptyDay: DayState = {
  water: 0,
  protein: 0,
  weight: "",
  vitamins: [],
};
export const defaultSettings: Settings = {
  proteinGoal: 90,
  dose: "2",
  doseDay: "Thursday",
  doseTime: "19:30",
  supplements: [],
  lastDoseDate: "",
};

export async function readDay(userId: string, day: string): Promise<DayState> {
  const row = await env.DB.prepare(
    "SELECT water_glasses, protein_g, weight_kg, vitamins_json FROM daily_metrics WHERE user_id = ? AND day = ?",
  )
    .bind(userId, day)
    .first<{
      water_glasses: number;
      protein_g: number;
      weight_kg: number | null;
      vitamins_json: string;
    }>();
  if (row)
    return {
      water: row.water_glasses,
      protein: row.protein_g,
      weight: row.weight_kg == null ? "" : String(row.weight_kg),
      vitamins: JSON.parse(row.vitamins_json),
    };
  const legacy = await env.DB.prepare(
    "SELECT data_json FROM tracker_state WHERE user_id = ? AND day = ?",
  )
    .bind(userId, day)
    .first<{ data_json: string }>();
  return legacy ? { ...emptyDay, ...JSON.parse(legacy.data_json) } : emptyDay;
}

export async function writeDay(userId: string, day: string, data: DayState) {
  await env.DB.prepare(
    `INSERT INTO daily_metrics (user_id, day, water_glasses, protein_g, weight_kg, vitamins_json, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, day) DO UPDATE SET water_glasses=excluded.water_glasses, protein_g=excluded.protein_g, weight_kg=excluded.weight_kg, vitamins_json=excluded.vitamins_json, updated_at=CURRENT_TIMESTAMP`,
  )
    .bind(
      userId,
      day,
      data.water,
      data.protein,
      data.weight ? Number(data.weight) : null,
      JSON.stringify(data.vitamins),
    )
    .run();
}

export async function readSettings(userId: string): Promise<Settings> {
  const row = await env.DB.prepare(
    "SELECT protein_goal_g, dose_mg, dose_day, dose_time, supplements_json, last_dose_date FROM user_settings WHERE user_id = ?",
  )
    .bind(userId)
    .first<{
      protein_goal_g: number;
      dose_mg: number;
      dose_day: string;
      dose_time: string;
      supplements_json: string;
      last_dose_date: string | null;
    }>();
  if (row)
    return {
      proteinGoal: row.protein_goal_g,
      dose: String(row.dose_mg),
      doseDay: row.dose_day as Settings["doseDay"],
      doseTime: row.dose_time,
      supplements: JSON.parse(row.supplements_json),
      lastDoseDate: row.last_dose_date ?? "",
    };
  const legacy = await env.DB.prepare(
    "SELECT data_json FROM tracker_state WHERE user_id = ? AND day = 'settings'",
  )
    .bind(userId)
    .first<{ data_json: string }>();
  return legacy
    ? {
        ...defaultSettings,
        ...JSON.parse(legacy.data_json),
        proteinGoal: JSON.parse(legacy.data_json).proteinGoal ?? 90,
      }
    : defaultSettings;
}

export async function writeSettings(userId: string, data: Settings) {
  await env.DB.prepare(
    `INSERT INTO user_settings (user_id, protein_goal_g, dose_mg, dose_day, dose_time, supplements_json, last_dose_date, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET protein_goal_g=excluded.protein_goal_g, dose_mg=excluded.dose_mg, dose_day=excluded.dose_day, dose_time=excluded.dose_time, supplements_json=excluded.supplements_json, last_dose_date=excluded.last_dose_date, updated_at=CURRENT_TIMESTAMP`,
  )
    .bind(
      userId,
      data.proteinGoal,
      Number(data.dose),
      data.doseDay,
      data.doseTime,
      JSON.stringify(data.supplements),
      data.lastDoseDate || null,
    )
    .run();
}

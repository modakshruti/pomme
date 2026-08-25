CREATE TABLE IF NOT EXISTS daily_metrics (
  user_id TEXT NOT NULL,
  day TEXT NOT NULL,
  water_glasses INTEGER NOT NULL DEFAULT 0 CHECK (water_glasses BETWEEN 0 AND 8),
  protein_g REAL NOT NULL DEFAULT 0 CHECK (protein_g >= 0),
  weight_kg REAL,
  vitamins_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, day)
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY,
  protein_goal_g INTEGER NOT NULL DEFAULT 90 CHECK (protein_goal_g BETWEEN 20 AND 300),
  dose_mg REAL NOT NULL DEFAULT 2 CHECK (dose_mg >= 0),
  dose_day TEXT NOT NULL DEFAULT 'Thursday',
  dose_time TEXT NOT NULL DEFAULT '19:30',
  supplements_json TEXT NOT NULL DEFAULT '[]',
  last_dose_date TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_day
ON daily_metrics(user_id, day);

PRAGMA optimize;

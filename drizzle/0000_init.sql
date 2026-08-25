CREATE TABLE IF NOT EXISTS tracker_state (
  user_id TEXT NOT NULL,
  day TEXT NOT NULL,
  data_json TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, day)
);
CREATE INDEX IF NOT EXISTS idx_tracker_state_user_day ON tracker_state(user_id, day);
PRAGMA optimize;

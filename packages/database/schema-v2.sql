CREATE TABLE IF NOT EXISTS findings (
 id TEXT PRIMARY KEY,
 engagement_id TEXT NOT NULL,
 severity TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'open'
);

CREATE TABLE IF NOT EXISTS workpapers (
 id TEXT PRIMARY KEY,
 engagement_id TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'draft'
);

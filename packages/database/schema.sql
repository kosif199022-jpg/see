-- SEE Audit Database Foundation
CREATE TABLE engagements (
 id TEXT PRIMARY KEY,
 client_name TEXT NOT NULL,
 period TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'draft'
);

CREATE TABLE accounts (
 id TEXT PRIMARY KEY,
 engagement_id TEXT REFERENCES engagements(id),
 code TEXT NOT NULL,
 name TEXT NOT NULL,
 balance_minor TEXT NOT NULL
);

CREATE TABLE evidence (
 id TEXT PRIMARY KEY,
 engagement_id TEXT REFERENCES engagements(id),
 source TEXT NOT NULL,
 hash TEXT,
 review_state TEXT DEFAULT 'draft'
);

CREATE TABLE audit_events (
 id TEXT PRIMARY KEY,
 actor TEXT NOT NULL,
 action TEXT NOT NULL,
 created_at TEXT NOT NULL
);

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS engagement_revisions (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  reason TEXT NOT NULL,
  actor TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(engagement_id, revision)
);
CREATE INDEX IF NOT EXISTS idx_engagement_revisions_engagement ON engagement_revisions(engagement_id, revision);

CREATE TABLE IF NOT EXISTS pbc_requests (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'draft',
  due_at TEXT,
  evidence_id TEXT REFERENCES evidence(id),
  revision INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pbc_engagement_status ON pbc_requests(engagement_id, status);

CREATE TABLE IF NOT EXISTS procedures (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  risk_id TEXT REFERENCES risks(id),
  title TEXT NOT NULL,
  objective TEXT NOT NULL,
  procedure_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  owner TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_procedures_engagement_status ON procedures(engagement_id, status);

CREATE TABLE IF NOT EXISTS procedure_runs (
  id TEXT PRIMARY KEY,
  procedure_id TEXT NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
  engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  result TEXT NOT NULL DEFAULT '',
  conclusion TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  performed_by TEXT NOT NULL,
  performed_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_procedure_runs_engagement_status ON procedure_runs(engagement_id, status);
CREATE INDEX IF NOT EXISTS idx_procedure_runs_procedure ON procedure_runs(procedure_id, created_at);

CREATE TABLE IF NOT EXISTS workpapers (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  procedure_id TEXT REFERENCES procedures(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  current_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_workpapers_engagement_status ON workpapers(engagement_id, status);

CREATE TABLE IF NOT EXISTS workpaper_versions (
  id TEXT PRIMARY KEY,
  workpaper_id TEXT NOT NULL REFERENCES workpapers(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  conclusion TEXT NOT NULL DEFAULT '',
  preparer TEXT NOT NULL,
  reviewer TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  UNIQUE(workpaper_id, version)
);
CREATE INDEX IF NOT EXISTS idx_workpaper_versions_workpaper ON workpaper_versions(workpaper_id, version);

CREATE TABLE IF NOT EXISTS review_notes (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  workpaper_id TEXT REFERENCES workpapers(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_by TEXT NOT NULL,
  cleared_by TEXT,
  created_at TEXT NOT NULL,
  cleared_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_review_notes_engagement_status ON review_notes(engagement_id, status);

CREATE TABLE IF NOT EXISTS evidence_links (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  evidence_id TEXT NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  relation TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(evidence_id, target_type, target_id, relation)
);
CREATE INDEX IF NOT EXISTS idx_evidence_links_target ON evidence_links(engagement_id, target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_evidence_links_evidence ON evidence_links(evidence_id, created_at);

CREATE TABLE IF NOT EXISTS council_runs (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'prepared',
  task TEXT NOT NULL,
  evidence_snapshot_json TEXT NOT NULL DEFAULT '{}',
  synthesis_json TEXT,
  human_decision TEXT,
  human_rationale TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_council_runs_engagement_status ON council_runs(engagement_id, status);

CREATE TABLE IF NOT EXISTS report_versions (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  readiness_snapshot_json TEXT NOT NULL,
  narrative TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  approved_at TEXT,
  UNIQUE(engagement_id, version)
);
CREATE INDEX IF NOT EXISTS idx_report_versions_engagement_status ON report_versions(engagement_id, status);

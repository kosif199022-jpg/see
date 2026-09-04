PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  source_version TEXT NOT NULL,
  entry_number TEXT NOT NULL,
  line_number INTEGER NOT NULL DEFAULT 1,
  entry_date TEXT,
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL DEFAULT '',
  debit_minor INTEGER NOT NULL DEFAULT 0,
  credit_minor INTEGER NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  user_name TEXT,
  is_manual INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_journal_entries_engagement ON journal_entries(engagement_id, entry_date, entry_number);

CREATE TABLE IF NOT EXISTS journal_review_runs (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  engine_version TEXT NOT NULL,
  source_version TEXT,
  parameters_json TEXT NOT NULL DEFAULT '{}',
  total_entries INTEGER NOT NULL DEFAULT 0,
  flagged_entries INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_journal_runs_engagement ON journal_review_runs(engagement_id, created_at);

CREATE TABLE IF NOT EXISTS journal_review_items (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  run_id TEXT NOT NULL REFERENCES journal_review_runs(id) ON DELETE CASCADE,
  journal_entry_id TEXT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  signal_code TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'attention',
  rationale TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_journal_items_engagement_status ON journal_review_items(engagement_id, status);
CREATE INDEX IF NOT EXISTS idx_journal_items_run ON journal_review_items(run_id, journal_entry_id);

CREATE TABLE IF NOT EXISTS journal_review_decisions (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  review_item_id TEXT NOT NULL REFERENCES journal_review_items(id) ON DELETE CASCADE,
  disposition TEXT NOT NULL,
  rationale TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  reviewed_by TEXT NOT NULL,
  reviewed_at TEXT NOT NULL,
  UNIQUE(review_item_id)
);
CREATE INDEX IF NOT EXISTS idx_journal_decisions_engagement ON journal_review_decisions(engagement_id, reviewed_at);

CREATE TABLE IF NOT EXISTS sampling_runs (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  population_source TEXT NOT NULL,
  method TEXT NOT NULL,
  seed INTEGER NOT NULL,
  parameters_json TEXT NOT NULL,
  selected_ids_json TEXT NOT NULL,
  engine_version TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sampling_runs_engagement ON sampling_runs(engagement_id, created_at);

CREATE TABLE IF NOT EXISTS risk_responses (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  risk_id TEXT NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
  response_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  rationale TEXT NOT NULL,
  owner TEXT,
  procedure_id TEXT REFERENCES procedures(id),
  evidence_id TEXT REFERENCES evidence(id),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  closed_by TEXT,
  closed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_risk_responses_engagement_status ON risk_responses(engagement_id, status);
CREATE INDEX IF NOT EXISTS idx_risk_responses_risk ON risk_responses(risk_id, created_at);

CREATE TABLE IF NOT EXISTS round_decisions (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  round_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  rationale TEXT NOT NULL DEFAULT '',
  actor TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  UNIQUE(engagement_id, round_code, version)
);
CREATE INDEX IF NOT EXISTS idx_round_decisions_engagement ON round_decisions(engagement_id, round_code, version);

CREATE TABLE IF NOT EXISTS standard_usages (
  id TEXT PRIMARY KEY,
  engagement_id TEXT NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  standard_code TEXT NOT NULL,
  source_family TEXT NOT NULL,
  source_version TEXT,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  rationale TEXT NOT NULL DEFAULT '',
  actor TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_standard_usages_engagement ON standard_usages(engagement_id, standard_code, created_at);
CREATE INDEX IF NOT EXISTS idx_standard_usages_target ON standard_usages(engagement_id, target_type, target_id);

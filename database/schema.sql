-- CyberGH Database Schema (PostgreSQL)
-- Run this once against your Aiven PostgreSQL instance

-- ── Scans ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scans (
  id           VARCHAR(36)   NOT NULL PRIMARY KEY,
  domain       VARCHAR(255)  NOT NULL,
  email        VARCHAR(255)  NULL,
  score        SMALLINT      NULL,
  status       VARCHAR(20)   NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','running','complete','failed')),
  ip_address   VARCHAR(45)   NULL,
  duration_ms  INTEGER       NULL,
  previous_scan_id VARCHAR(36) NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ   NULL
);

CREATE INDEX IF NOT EXISTS idx_scans_domain ON scans(domain);
CREATE INDEX IF NOT EXISTS idx_scans_email  ON scans(email);
CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);

-- ── Findings ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS findings (
  id          SERIAL        PRIMARY KEY,
  scan_id     VARCHAR(36)   NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  category    VARCHAR(64)   NOT NULL,
  severity    VARCHAR(20)   NOT NULL
                            CHECK (severity IN ('critical','high','medium','low','info','pass')),
  title       VARCHAR(255)  NOT NULL,
  description TEXT          NOT NULL,
  fix         TEXT          NULL,
  evidence    TEXT          NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_findings_scan_id  ON findings(scan_id);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);

-- ── Scan Logs ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scan_logs (
  id          SERIAL        PRIMARY KEY,
  scan_id     VARCHAR(36)   NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  step_name   VARCHAR(64)   NOT NULL,
  status      VARCHAR(20)   NOT NULL,
  duration_ms INTEGER       NULL,
  error_msg   TEXT          NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scan_logs_scan_id ON scan_logs(scan_id);

-- ── Users ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL        PRIMARY KEY,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  name          VARCHAR(255)  NULL,
  company       VARCHAR(255)  NULL,
  plan          VARCHAR(20)   NOT NULL DEFAULT 'free'
                              CHECK (plan IN ('free','starter','pro')),
  monitored_domains JSONB     NULL,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);


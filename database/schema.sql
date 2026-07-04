-- CyberGH Database Schema
-- Run this once against your Aiven MySQL instance

CREATE DATABASE IF NOT EXISTS cybergh
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cybergh;

-- ── Scans ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scans (
  id           VARCHAR(36)   NOT NULL PRIMARY KEY,  -- UUID
  domain       VARCHAR(255)  NOT NULL,
  email        VARCHAR(255)  NULL,                   -- captured to unlock full report
  score        TINYINT       NULL,                   -- 0–100, set when scan completes
  status       ENUM('pending','running','complete','failed') NOT NULL DEFAULT 'pending',
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME      NULL,
  INDEX idx_domain (domain),
  INDEX idx_email  (email),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Findings ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS findings (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  scan_id     VARCHAR(36)   NOT NULL,
  category    VARCHAR(64)   NOT NULL,  -- 'ssl', 'headers', 'paths', 'dns', 'ports', 'breach'
  severity    ENUM('critical','high','medium','low','info','pass') NOT NULL,
  title       VARCHAR(255)  NOT NULL,
  description TEXT          NOT NULL,  -- what this means in plain language
  fix         TEXT          NULL,       -- exactly how to fix it
  evidence    TEXT          NULL,       -- raw value we found (e.g. the header value)
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE,
  INDEX idx_scan_id  (scan_id),
  INDEX idx_severity (severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Users ──────────────────────────────────────────────────────
-- Added now but used from Week 3 (subscription tier)
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  name          VARCHAR(255)  NULL,
  company       VARCHAR(255)  NULL,
  plan          ENUM('free','starter','pro') NOT NULL DEFAULT 'free',
  monitored_domains JSON      NULL,   -- array of domains on subscription
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

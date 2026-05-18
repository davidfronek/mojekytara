-- =============================================================
-- mojeKytara – počáteční migrace
-- Databáze: PostgreSQL
-- Spustit: psql -d kytara -f 001_initial.sql
-- =============================================================

-- Uživatelé
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  username      VARCHAR(100)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Písničky (uložené uživatelem)
CREATE TABLE songs (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           VARCHAR(255)  NOT NULL,
  text_content   TEXT          NOT NULL,
  strum_pattern  VARCHAR(50),          -- id patternu, např. 'DDUDU' nebo 'custom'
  custom_pattern VARCHAR(100),         -- vlastní pattern, pokud strum_pattern = 'custom'
  secs_per_chord INTEGER       NOT NULL DEFAULT 4,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_songs_user_id ON songs(user_id);

-- Automatická aktualizace updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER songs_updated_at
  BEFORE UPDATE ON songs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

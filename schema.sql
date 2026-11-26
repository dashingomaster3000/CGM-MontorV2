-- Opretter tabellerne patients, brugere, maalinger, symptomer og session
-- Køres i Neons SQL Editor før seed.sql

CREATE TABLE patients (
  id SERIAL PRIMARY KEY,
  cpr VARCHAR(10) NOT NULL UNIQUE,
  navn VARCHAR(200) NOT NULL
);

-- Brugere uden patient_id er sundhedsprofessionelle
CREATE TABLE brugere (
  id SERIAL PRIMARY KEY,
  brugernavn VARCHAR(254) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  patient_id INTEGER REFERENCES patients (id)
);

-- Højst én konto pr. patient
CREATE UNIQUE INDEX IF NOT EXISTS brugere_patient_id_unique
  ON brugere (patient_id)
  WHERE patient_id IS NOT NULL;

CREATE TABLE maalinger (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients (id),
  tidspunkt TIMESTAMP NOT NULL,
  glukose_mmol NUMERIC(4,1) NOT NULL,
  -- Ingen to målinger for samme patient på samme tidspunkt
  UNIQUE (patient_id, tidspunkt)
);

CREATE TABLE symptomer (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients (id),
  tidspunkt TIMESTAMP NOT NULL,
  beskrivelse TEXT NOT NULL
);

-- Login-sessioner (bruges af connect-pg-simple)
CREATE TABLE session (
  sid VARCHAR PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);
CREATE INDEX idx_session_expire ON session (expire);

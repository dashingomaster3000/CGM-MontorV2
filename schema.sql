-- Opretter databasens tabeller: patients, brugere, maalinger og symptomer.
-- Køres manuelt i Neons SQL Editor, før seed.sql.

CREATE TABLE patients (
  id SERIAL PRIMARY KEY,
  cpr VARCHAR(10) NOT NULL UNIQUE,
  navn VARCHAR(200) NOT NULL
);

CREATE TABLE brugere (
  id SERIAL PRIMARY KEY,
  brugernavn VARCHAR(254) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  patient_id INTEGER REFERENCES patients (id)
);

-- Tillad flere sundhedsprofessionelle uden patient_id, men kun én konto pr. patient.
ALTER TABLE brugere
  ADD COLUMN IF NOT EXISTS patient_id INTEGER REFERENCES patients (id);

CREATE UNIQUE INDEX IF NOT EXISTS brugere_patient_id_unique
  ON brugere (patient_id)
  WHERE patient_id IS NOT NULL;

CREATE TABLE maalinger (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients (id),
  tidspunkt TIMESTAMP NOT NULL,
  glukose_mmol NUMERIC(4,1) NOT NULL,
  -- Samme patient kan ikke have to målinger på samme tidspunkt (ingen dubletter)
  UNIQUE (patient_id, tidspunkt)
);

CREATE TABLE symptomer (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients (id),
  tidspunkt TIMESTAMP NOT NULL,
  beskrivelse TEXT NOT NULL
);

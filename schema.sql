-- Lektion 15, øvelse 3 — gruppens database (Neon-projekt "diabeto").
-- Kørt i Neons SQL Editor. Kun syntetiske data.

CREATE TABLE patients (
  id SERIAL PRIMARY KEY,
  cpr VARCHAR(10) NOT NULL UNIQUE,
  navn VARCHAR(200) NOT NULL
);

INSERT INTO patients (cpr, navn) VALUES
  ('2512489996', 'Nancy Ann Test Berggren'),
  ('0107729995', 'Max Test Berggren'),
  ('2911829996', 'Kirsten Test Berggren'),
  ('1509819996', 'Brita Test Berggren'),
  ('3103979995', 'Anders Test Jensen');

CREATE TABLE maalinger (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients (id),
  tidspunkt TIMESTAMP NOT NULL,
  glukose_mmol NUMERIC(4,1) NOT NULL
);

INSERT INTO maalinger (patient_id, tidspunkt, glukose_mmol)
VALUES (2, '2026-10-28 08:00', 6.2);

SELECT id, patient_id, tidspunkt, glukose_mmol
FROM maalinger
WHERE patient_id = 2;

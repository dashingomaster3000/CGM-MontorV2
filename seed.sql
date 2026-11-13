-- Testdata (kun syntetiske data) til patients og maalinger.
-- Køres manuelt i Neons SQL Editor, efter schema.sql.
-- Kan køres flere gange: ON CONFLICT DO NOTHING springer rækker over, der allerede findes.

-- Fem syntetiske testpatienter.
-- Findes CPR-nummeret allerede, indsættes patienten ikke igen.
INSERT INTO patients (cpr, navn) VALUES
  ('2512489996', 'Nancy Ann Test Berggren'),
  ('0107729995', 'Max Test Berggren'),
  ('2911829996', 'Kirsten Test Berggren'),
  ('1509819996', 'Brita Test Berggren'),
  ('3103979995', 'Anders Test Jensen')
ON CONFLICT (cpr) DO NOTHING;

-- Syntetiske patientkonti med hver sin bcrypt-hash og unikke salt.
-- Kontiene kobles via CPR, ikke antagne patient-id'er.
INSERT INTO brugere (brugernavn, password_hash, patient_id)
SELECT konto.brugernavn,
       konto.password_hash,
       patient.id
FROM (VALUES
  ('nancy.berggren@diabeto.test', '2512489996', '$2b$10$6ikGJJr1xZ9tKFd74oDJH.Mibfxa9dlqgTFaQxVcvNcABV3DUZIVq'),
  ('max.berggren@diabeto.test', '0107729995', '$2b$10$q6QBpbJmegXo4cNt8VclSuT//iU4HSBnryYV62bBgU4/etn/iwdYK'),
  ('kirsten.berggren@diabeto.test', '2911829996', '$2b$10$GYke80LwZz3wUfyZdu8wl.TqiHKhbx3VouXGoCFZPIYUcVbxwXbXu'),
  ('brita.berggren@diabeto.test', '1509819996', '$2b$10$faPaYeTVDLVQckQ1otBf9OmFkI8EfhMq6wilfbUczrdM0bViNI2w2'),
  ('anders.jensen@diabeto.test', '3103979995', '$2b$10$k95AVJSXgU/5K2M156K3xuPHlbECpSVwTFbFbIx1NR1a6yMLTgpLi')
) AS konto(brugernavn, cpr, password_hash)
JOIN patients AS patient ON patient.cpr = konto.cpr
ON CONFLICT (brugernavn)
DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  patient_id = EXCLUDED.patient_id;

-- Syntetisk sundhedsprofessionel: har adgang til patientlisten og CPR-søgning.
INSERT INTO brugere (brugernavn, password_hash, patient_id)
VALUES (
  'sundhed@diabeto.test',
  '$2b$10$tPSVZSUUmZx8IoBJPwsNUuKMOh8kC/syqmLLhCU5R2pmxVJ4ocIVy',
  NULL
)
ON CONFLICT (brugernavn)
DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  patient_id = NULL;

-- Én måling for Max og fire målinger om dagen for Nancy
-- fra 27/10 til 9/11 (14 dage, vises på History-siden).
-- Patientnumrene i værdilisten oversættes til syntetiske CPR-numre nedenfor.
-- Har patienten allerede en måling på samme tidspunkt, indsættes den ikke igen.
INSERT INTO maalinger (patient_id, tidspunkt, glukose_mmol)
SELECT patient.id, maaling.tidspunkt::timestamp, maaling.glukose_mmol
FROM (VALUES
  (2, '2026-11-03 08:00', 6.2),

  (1, '2026-10-27 06:00', 6.0),
  (1, '2026-10-27 12:00', 8.1),
  (1, '2026-10-27 18:00', 6.9),
  (1, '2026-10-27 23:00', 5.9),

  (1, '2026-10-28 06:00', 5.8),
  (1, '2026-10-28 12:00', 7.8),
  (1, '2026-10-28 18:00', 6.7),
  (1, '2026-10-28 23:00', 8.7),

  (1, '2026-10-29 06:00', 3.4),
  (1, '2026-10-29 12:00', 7.4),
  (1, '2026-10-29 18:00', 7.7),
  (1, '2026-10-29 23:00', 8.2),

  (1, '2026-10-30 06:00', 6.7),
  (1, '2026-10-30 12:00', 5.9),
  (1, '2026-10-30 18:00', 8.6),
  (1, '2026-10-30 23:00', 5.8),

  (1, '2026-10-31 06:00', 6.8),
  (1, '2026-10-31 12:00', 6.3),
  (1, '2026-10-31 18:00', 8.9),
  (1, '2026-10-31 23:00', 6.9),

  (1, '2026-11-01 06:00', 3.6),
  (1, '2026-11-01 12:00', 5.8),
  (1, '2026-11-01 18:00', 10.5),
  (1, '2026-11-01 23:00', 9.1),

  (1, '2026-11-02 06:00', 4.3),
  (1, '2026-11-02 12:00', 7.6),
  (1, '2026-11-02 18:00', 10.6),
  (1, '2026-11-02 23:00', 5.6),

  (1, '2026-11-03 06:00', 5.6),
  (1, '2026-11-03 12:00', 8.0),
  (1, '2026-11-03 18:00', 9.4),
  (1, '2026-11-03 23:00', 6.0),

  (1, '2026-11-04 06:00', 4.5),
  (1, '2026-11-04 12:00', 9.9),
  (1, '2026-11-04 18:00', 8.4),
  (1, '2026-11-04 23:00', 5.8),

  (1, '2026-11-05 06:00', 3.2),
  (1, '2026-11-05 12:00', 7.1),
  (1, '2026-11-05 18:00', 7.1),
  (1, '2026-11-05 23:00', 8.2),

  (1, '2026-11-06 06:00', 5.3),
  (1, '2026-11-06 12:00', 7.1),
  (1, '2026-11-06 18:00', 6.8),
  (1, '2026-11-06 23:00', 8.9),

  (1, '2026-11-07 06:00', 4.9),
  (1, '2026-11-07 12:00', 9.5),
  (1, '2026-11-07 18:00', 8.5),
  (1, '2026-11-07 23:00', 5.8),

  (1, '2026-11-08 06:00', 3.7),
  (1, '2026-11-08 12:00', 7.4),
  (1, '2026-11-08 18:00', 9.7),
  (1, '2026-11-08 23:00', 7.7),

  (1, '2026-11-09 06:00', 4.4),
  (1, '2026-11-09 12:00', 6.6),
  (1, '2026-11-09 18:00', 8.4),
  (1, '2026-11-09 23:00', 5.2)
) AS maaling(testpatient, tidspunkt, glukose_mmol)
JOIN patients AS patient
  ON patient.cpr = CASE maaling.testpatient
    WHEN 1 THEN '2512489996'
    WHEN 2 THEN '0107729995'
  END
ON CONFLICT (patient_id, tidspunkt) DO NOTHING;

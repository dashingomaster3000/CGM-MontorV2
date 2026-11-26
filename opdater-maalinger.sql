-- Opdaterer de eksisterende målinger i Neon
-- Køres i Neons SQL Editor

-- Flytter målingerne 6 dage frem, kun hvis nyeste måling er før 4/11
UPDATE maalinger
SET tidspunkt = tidspunkt + INTERVAL '6 days'
WHERE (SELECT MAX(tidspunkt) FROM maalinger) < '2026-11-04';

-- Ingen to målinger for samme patient på samme tidspunkt
CREATE UNIQUE INDEX IF NOT EXISTS maalinger_patient_tidspunkt
ON maalinger (patient_id, tidspunkt);

-- Opdaterer de eksisterende målinger i Neon. Køres manuelt i Neons SQL Editor.
-- Kan køres flere gange uden at ændre noget anden gang.

-- Trin 1: Flytter alle målinger 6 dage frem, så de ligger inden for de seneste 14 dage.
-- Værdierne og klokkeslættene er de samme, og der kommer ikke flere målinger.
-- Der flyttes kun, hvis den nyeste måling er fra før 4/11 (altså kun første gang).
UPDATE maalinger
SET tidspunkt = tidspunkt + INTERVAL '6 days'
WHERE (SELECT MAX(tidspunkt) FROM maalinger) < '2026-11-04';

-- Trin 2: Samme patient kan ikke have to målinger på samme tidspunkt (ingen dubletter).
-- IF NOT EXISTS gør, at linjen ikke giver fejl, hvis reglen allerede findes.
CREATE UNIQUE INDEX IF NOT EXISTS maalinger_patient_tidspunkt
ON maalinger (patient_id, tidspunkt);

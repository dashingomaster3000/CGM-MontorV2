-- Sletter dobbelte målinger i tabellen maalinger.
-- De opstod, fordi seed.sql blev kørt to gange.
-- Køres manuelt i Neons SQL Editor. Det er ufarligt at køre den igen.

-- To rækker er en dublet, når patient, tidspunkt og værdi er ens.
-- Vi beholder rækken med det laveste id og sletter den anden.
DELETE FROM maalinger a
USING maalinger b
WHERE a.patient_id = b.patient_id
  AND a.tidspunkt = b.tidspunkt
  AND a.glukose_mmol = b.glukose_mmol
  AND a.id > b.id;

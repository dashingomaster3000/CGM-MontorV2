-- Sletter dobbelte målinger i tabellen maalinger
-- Køres i Neons SQL Editor

-- Dublet: samme patient, tidspunkt og værdi; rækken med laveste id beholdes
DELETE FROM maalinger a
USING maalinger b
WHERE a.patient_id = b.patient_id
  AND a.tidspunkt = b.tidspunkt
  AND a.glukose_mmol = b.glukose_mmol
  AND a.id > b.id;

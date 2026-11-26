-- Sletter testsymptomer med urealistiske årstal, en dublet og en testrække
-- Køres i Neons SQL Editor; id 1, 3 og 14 beholdes

-- id 5 er en dublet, id 13 er en testrække, resten har årstal som 0001 og 4000
DELETE FROM symptomer
WHERE id IN (4, 5, 6, 7, 8, 9, 10, 11, 12, 13);

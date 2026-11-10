-- Sletter testsymptomer med urealistiske årstal, en dublet og en testrække.
-- Køres manuelt i Neons SQL Editor. Det er ufarligt at køre den igen.
-- Vi beholder tre symptomer: id 1 (Dizzy), id 3 (Shaky hands) og id 14 (Ømhed i skulderen).

-- id 5 er en dublet af id 1, id 13 hedder bare "test",
-- og resten har årstal som 0001, 1212 og 4000.
DELETE FROM symptomer
WHERE id IN (4, 5, 6, 7, 8, 9, 10, 11, 12, 13);

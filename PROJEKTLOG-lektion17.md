# Projektlog – Lektion 17 (Øvelse 3: Gruppens centrale brugerhandling)

## Central handling
En patient melder et symptom på siden **Report symptoms** (`public/Feedback/MeldSymptomer.html`).
Symptomet gemmes i tabellen `symptomer` (id, patient_id, tidspunkt, beskrivelse).

- Repository: `symptomer.js` → `opretSymptom` (INSERT … RETURNING) og `hentAlleSymptomer` (SELECT … ORDER BY id)
- Routes i `server.js`: `GET /api/symptomer` og `POST /api/symptomer`
- Frontend: formular med `<select>` til patienten (fra `/api/patients`) og en tabel med alle symptomer

## Testskema
Testet med `api.http` mod `http://localhost:3000` den 4/11-2026. Kun syntetiske data.

| # | Request | Forventet | Fik |
|---|---------|-----------|-----|
| 1 | `GET /api/symptomer` | 200 + JSON-liste | 200 |
| 2 | `POST /api/symptomer` med `{"patient_id":1,"tidspunkt":"2026-11-04 08:30","beskrivelse":"Dizzy"}` | 201 + den nye række | 201 (id 5) |
| 3 | `POST /api/symptomer` uden `patient_id` | 400 | 400 |
| 4 | `GET /api/symptomer` efter genstart af serveren | 200, rækken fra #2 er der stadig | 200, id 5 er der stadig |
| 5 | `GET /findesikke` | 404 | 404 |

const pool = require("./db");

// Henter én patients symptomer, sorteret efter tidspunkt.
async function hentSymptomer(patientId) {
  const result = await pool.query(
    "SELECT id, patient_id, tidspunkt, beskrivelse FROM symptomer WHERE patient_id = $1 ORDER BY tidspunkt",
    [patientId]
  );
  return result.rows;
}

// Henter alle symptomer fra alle patienter, sorteret efter id.
async function hentAlleSymptomer() {
  const result = await pool.query(
    "SELECT id, patient_id, tidspunkt, beskrivelse FROM symptomer ORDER BY id"
  );
  return result.rows;
}

// Gemmer et nyt symptom og returnerer den gemte række.
async function opretSymptom(patientId, tidspunkt, beskrivelse) {
  const result = await pool.query(
    "INSERT INTO symptomer (patient_id, tidspunkt, beskrivelse) VALUES ($1, $2, $3) RETURNING id, patient_id, tidspunkt, beskrivelse",
    [patientId, tidspunkt, beskrivelse]
  );
  return result.rows[0];
}

// Gør funktionerne tilgængelige for server.js.
module.exports = { hentSymptomer, hentAlleSymptomer, opretSymptom };

const db = require("./db");

// Henter alle patienter, sorteret efter navn.
async function hentAllePatienter() {
  const result = await db.query("SELECT id, cpr, navn FROM patients ORDER BY navn");
  return result.rows;
}

// Henter én patient ud fra CPR-nummeret. Giver undefined, hvis den ikke findes.
async function hentPatientMedCpr(cpr) {
  const result = await db.query(
    "SELECT id, cpr, navn FROM patients WHERE cpr = $1",
    [cpr]
  );
  return result.rows[0];
}

// Henter én patients målinger, sorteret efter tidspunkt.
async function hentMaalinger(patientId) {
  const result = await db.query(
    "SELECT tidspunkt, glukose_mmol FROM maalinger WHERE patient_id = $1 ORDER BY tidspunkt",
    [patientId]
  );
  return result.rows;
}

// Gemmer en ny patient og returnerer den gemte række.
async function opretPatient(cpr, navn) {
  const result = await db.query(
    "INSERT INTO patients (cpr, navn) VALUES ($1, $2) RETURNING id, cpr, navn",
    [cpr, navn]
  );
  return result.rows[0];
}

// Gør funktionerne tilgængelige for server.js.
module.exports = { hentAllePatienter, hentPatientMedCpr, hentMaalinger, opretPatient };

const pool = require("./db");

// Henter alle patienter, sorteret efter navn.
async function hentPatienter() {
  const result = await pool.query("SELECT id, cpr, navn FROM patients ORDER BY navn");
  return result.rows;
}

// Henter én patient ud fra CPR-nummeret. Giver undefined, hvis den ikke findes.
async function hentPatientMedCpr(cpr) {
  const result = await pool.query(
    "SELECT id, cpr, navn FROM patients WHERE cpr = $1",
    [cpr]
  );
  return result.rows[0];
}

// M-II: Henter én patients målinger for de seneste 14 dage, sorteret efter tidspunkt.
// De 14 dage regnes fra patientens nyeste måling (den dag og 13 dage tilbage).
// Dashboard og History bruger begge denne funktion, så de viser samme periode.
async function hentMaalingerSeneste14Dage(patientId) {
  const result = await pool.query(
    `SELECT tidspunkt, glukose_mmol
     FROM maalinger
     WHERE patient_id = $1
       AND tidspunkt >= (
         SELECT date_trunc('day', MAX(tidspunkt)) - INTERVAL '13 days'
         FROM maalinger
         WHERE patient_id = $1
       )
     ORDER BY tidspunkt`,
    [patientId]
  );
  return result.rows;
}

// Gemmer en ny patient og returnerer den gemte række.
async function opretPatient(cpr, navn) {
  const result = await pool.query(
    "INSERT INTO patients (cpr, navn) VALUES ($1, $2) RETURNING id, cpr, navn",
    [cpr, navn]
  );
  return result.rows[0];
}

// M-II: Gemmer én syntetisk testmåling. Findes målingen allerede på samme tidspunkt,
// sker der ingenting (så scriptet kan køres flere gange).
async function opretMaaling(patientId, tidspunkt, glukose) {
  const result = await pool.query(
    "INSERT INTO maalinger (patient_id, tidspunkt, glukose_mmol) VALUES ($1, $2, $3) ON CONFLICT (patient_id, tidspunkt) DO NOTHING RETURNING tidspunkt, glukose_mmol",
    [patientId, tidspunkt, glukose]
  );
  return result.rows[0];
}

// M-II: Ændrer værdien af én eksisterende måling (bruges til syntetiske testdata).
async function aendrMaaling(patientId, tidspunkt, glukose) {
  const result = await pool.query(
    "UPDATE maalinger SET glukose_mmol = $3 WHERE patient_id = $1 AND tidspunkt = $2 RETURNING tidspunkt, glukose_mmol",
    [patientId, tidspunkt, glukose]
  );
  return result.rows[0];
}

// Gør funktionerne tilgængelige for server.js.
module.exports = {
  hentPatienter, hentPatientMedCpr, hentMaalingerSeneste14Dage, opretPatient,
  opretMaaling, aendrMaaling
};

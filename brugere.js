const pool = require("./db");

async function findBruger(brugernavn) {
  const result = await pool.query(
    "SELECT id, brugernavn, password_hash, patient_id FROM brugere WHERE brugernavn = $1",
    [brugernavn]
  );
  return result.rows[0] ?? null;
}

module.exports = { findBruger };

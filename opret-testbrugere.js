// Opretter/opdaterer testkonti ud fra .env, så brugernavne og passwords ikke står i koden
// Kør "node opret-testbrugere.js" efter schema.sql og seed.sql

const bcrypt = require("bcryptjs");
const pool = require("./db");

const NANCY_CPR = "2512489996"; // syntetisk test-CPR fra seed.sql
const SALT_RUNDER = 10; // bcrypt genererer et nyt tilfældigt salt for hver hash

function hentEnv(navn) {
  const vaerdi = process.env[navn];
  if (!vaerdi) throw new Error(`${navn} mangler i .env`);
  return vaerdi;
}

async function main() {
  // Sundhedsprofessionel konto uden patient_id
  const sundhedBruger = hentEnv("TEST_BRUGER_SUNDHED");
  const sundhedHash = await bcrypt.hash(hentEnv("TEST_PASSWORD_SUNDHED"), SALT_RUNDER);
  await pool.query(
    `INSERT INTO brugere (brugernavn, password_hash, patient_id)
     VALUES ($1, $2, NULL)
     ON CONFLICT (brugernavn) DO UPDATE SET password_hash = EXCLUDED.password_hash, patient_id = NULL`,
    [sundhedBruger, sundhedHash]
  );
  console.log("Sundhedsprofessionel konto klar.");

  // Patientkonto koblet til Nancy (højst én konto pr. patient)
  const patient = await pool.query("SELECT id FROM patients WHERE cpr = $1", [NANCY_CPR]);
  if (patient.rows.length === 0) throw new Error("Testpatienten findes ikke. Kør seed.sql først.");
  const patientId = patient.rows[0].id;

  const patientBruger = hentEnv("TEST_BRUGER_PATIENT");
  const patientHash = await bcrypt.hash(hentEnv("TEST_PASSWORD_PATIENT"), SALT_RUNDER);
  const opdateret = await pool.query(
    "UPDATE brugere SET brugernavn = $1, password_hash = $2 WHERE patient_id = $3",
    [patientBruger, patientHash, patientId]
  );
  if (opdateret.rowCount === 0) {
    await pool.query(
      "INSERT INTO brugere (brugernavn, password_hash, patient_id) VALUES ($1, $2, $3)",
      [patientBruger, patientHash, patientId]
    );
  }
  console.log("Patientkonto klar.");
}

main()
  .catch(error => { console.error(error.message); process.exitCode = 1; })
  .finally(() => pool.end());

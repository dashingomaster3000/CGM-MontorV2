const express = require("express");
const path = require("path");
const pg = require("pg");

// Læser .env lokalt. På Vercel findes filen ikke, så fejlen ignoreres.
try {
  process.loadEnvFile();
} catch (error) {
  console.log("No .env file found");
}

// Tidspunkter sendes som tekst fra databasen.
// Så passer datoen uanset computerens tidszone.
pg.types.setTypeParser(1114, function (tekst) {
  return tekst;
});

// Forbindelse til Neon-databasen.
const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const app = express();

// Tillader forespørgsler fra frontendens lokale side via CORS.
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

// Gør det muligt for Express at læse JSON-data fra indkommende forespørgsler.
app.use(express.json());

// Udleverer frontend-filerne i public/ lokalt. På Vercel serverer Vercel selv public/.
app.use(express.static("public"));

// Sender forsiden, når klienten åbner /. Vercel sender / videre til Express.
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Returnerer alle patienter fra databasen, sorteret efter navn.
app.get("/api/patients", async (req, res) => {
  try {
    const result = await db.query("SELECT id, cpr, navn FROM patients ORDER BY navn");
    res.json(result.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "database error" });
  }
});

// Returnerer én patients målinger, sorteret efter tidspunkt.
app.get("/api/patients/:id/maalinger", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT tidspunkt, glukose_mmol FROM maalinger WHERE patient_id = $1 ORDER BY tidspunkt",
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "database error" });
  }
});

// Returnerer én patient ud fra CPR-nummeret i URL'en.
app.get("/api/patients/:cpr", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, cpr, navn FROM patients WHERE cpr = $1",
      [req.params.cpr]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "database error" });
  }
});

// Gemmer en ny patient i tabellen patients.
app.post("/api/patients", async (req, res) => {
  const { cpr, navn } = req.body ?? {};
  if (!cpr || !navn) {
    return res.status(400).json({ error: "cpr and name are required" });
  }
  try {
    const result = await db.query(
      "INSERT INTO patients (cpr, navn) VALUES ($1, $2) RETURNING id, cpr, navn",
      [cpr, navn]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "database error" });
  }
});

// Sidste middleware: returnerer JSON med status 404 for ukendte adresser.
app.use((req, res) => {
  res.status(404).json({ error: "not found" });
});

// Starter serveren på port 3000.
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});

const express = require("express");
const path = require("path");
const cors = require("cors");

// Repository-filerne. Al SQL ligger i dem, ikke her.
const patients = require("./patients");
const symptomer = require("./symptomer");

const app = express();

// Tillader forespørgsler fra andre adresser (CORS). Skal stå før alle routes.
app.use(cors());

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
    const liste = await patients.hentPatienter();
    res.json(liste);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Returnerer én patients målinger, sorteret efter tidspunkt.
app.get("/api/patients/:id/maalinger", async (req, res) => {
  try {
    const maalinger = await patients.hentMaalinger(req.params.id);
    res.json(maalinger);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "database error" });
  }
});

// Returnerer én patients symptomer, sorteret efter tidspunkt.
app.get("/api/patients/:id/symptomer", async (req, res) => {
  try {
    const liste = await symptomer.hentSymptomer(req.params.id);
    res.status(200).json(liste);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "database error" });
  }
});

// Returnerer én patient ud fra CPR-nummeret i URL'en.
app.get("/api/patients/:cpr", async (req, res) => {
  try {
    const patient = await patients.hentPatientMedCpr(req.params.cpr);
    if (!patient) {
      return res.status(404).json({ error: "not found" });
    }
    res.json(patient);
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
    const patient = await patients.opretPatient(cpr, navn);
    res.status(201).json(patient);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "database error" });
  }
});

// Returnerer alle symptomer fra tabellen symptomer, sorteret efter id.
app.get("/api/symptomer", async (req, res) => {
  try {
    const liste = await symptomer.hentAlleSymptomer();
    res.status(200).json(liste);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "database error" });
  }
});

// Gemmer et nyt symptom i tabellen symptomer.
app.post("/api/symptomer", async (req, res) => {
  const { patient_id, tidspunkt, beskrivelse } = req.body ?? {};

  // Tjekker felterne FØR databasen. Tom tekst eller kun mellemrum tæller som manglende.
  if (!patient_id || !String(tidspunkt ?? "").trim() || !String(beskrivelse ?? "").trim()) {
    return res.status(400).json({ error: "patient_id, tidspunkt and beskrivelse are required" });
  }

  try {
    const symptom = await symptomer.opretSymptom(patient_id, tidspunkt, beskrivelse.trim());
    res.status(201).json(symptom);
  } catch (err) {
    console.error(err);
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

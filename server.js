const express = require("express");
const path = require("path");

const app = express();
// Opretter en liste af patienter, som serveren returnerer fra /api/patients.
const patienter = [
  { cpr: "2512489996", navn: "Benny Jensen" },
  { cpr: "0102034567", navn: "Mads Nielsen" },
  { cpr: "1234567890", navn: "Anna Larsen" }
];

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

// Returnerer patientlisten som JSON, når klienten henter /api/patients.
app.get("/api/patients", (req, res) => {
  res.json(patienter);
});
// Returnerer en patient som JSON, når klienten henter /api/patients/:cpr. (:cpr er en parameter i URL'en, som kan bruges til at finde patienten i listen.)
app.get("/api/patients/:cpr", (req, res) => {
  const patient = patienter.find((p) => p.cpr === req.params.cpr);
  if (!patient) {
    return res.status(404).json({ error: "not found" });
  }
  res.json(patient);
});

app.post("/api/patients", (req, res) => {
  const { cpr, navn } = req.body ?? {};
  if (!cpr || !navn) {
    return res.status(400).json({ error: "cpr and name are required" });
  }
  patienter.push({ cpr, navn });
  res.status(201).json({ cpr, navn });
});

// Sidste middleware: returnerer JSON med status 404 for ukendte adresser.
app.use((req, res) => {
  res.status(404).json({ error: "not found" });
});

// Starter serveren på port 3000.
app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});

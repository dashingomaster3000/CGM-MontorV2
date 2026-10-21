const express = require("express");

const app = express();
// Opretter en liste af patienter, som serveren returnerer fra /api/patients.
const patienter = [
  { cpr: "2512489996", navn: "Benny Jensen" },
  { cpr: "0102034567", navn: "Mads Nielsen" }
];

// Tillader forespørgsler fra frontendens lokale side via CORS.
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

// Gør det muligt for Express at læse JSON-data fra indkommende forespørgsler.
app.use(express.json());

// Returnerer patientlisten som JSON, når klienten henter /api/patients.
app.get("/api/patients", (req, res) => {
  res.json(patienter);
});

// Sidste middleware: returnerer JSON med status 404 for ukendte adresser.
app.use((req, res) => {
  res.status(404).json({ error: "not found" });
});

// Starter serveren på port 3000.
app.listen(3000, () => {
  console.log("Server kører på http://localhost:3000");
});

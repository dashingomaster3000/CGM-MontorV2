const express = require("express");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcryptjs");

// Serveren regner i dansk tid. Ellers kører Vercel i UTC-tid,
// og et symptom meldt "lige nu" ville se ud til at ligge i fremtiden.
process.env.TZ = "Europe/Copenhagen";

// Repository-filerne. Al SQL ligger i dem, ikke her.
const patients = require("./patients");
const symptomer = require("./symptomer");
const brugere = require("./brugere");

const app = express();
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set in .env.");
}

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(cors());

app.use(express.json());
app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  })
);

app.use(express.static("public"));

// Sender forsiden, når klienten åbner /. Vercel sender / videre til Express.
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/api/login", async (req, res) => {
  const brugernavn =
    typeof req.body?.brugernavn === "string" ? req.body.brugernavn.trim() : "";
  const password =
    typeof req.body?.password === "string" ? req.body.password : "";

  if (!brugernavn || !password) {
    return res.status(400).json({ error: "E-mail and password are required" });
  }

  try {
    const bruger = await brugere.findBruger(brugernavn);
    if (!bruger || !(await bcrypt.compare(password, bruger.password_hash))) {
      return res.status(401).json({ error: "Invalid e-mail or password" });
    }

    req.session.regenerate((error) => {
      if (error) {
        console.error("Could not create login session:", error);
        return res.status(500).json({ error: "server error" });
      }

      req.session.bruger = {
        id: bruger.id,
        brugernavn: bruger.brugernavn,
        patient_id: bruger.patient_id,
        role: bruger.patient_id === null ? "professional" : "patient",
      };

      req.session.save((saveError) => {
        if (saveError) {
          console.error("Could not save login session:", saveError);
          return res.status(500).json({ error: "server error" });
        }

        res.json(req.session.bruger);
      });
    });
  } catch (error) {
    console.error("Could not log in:", error);
    res.status(500).json({ error: "server error" });
  }
});

app.get("/api/me", (req, res) => {
  if (!req.session.bruger) {
    return res.status(401).json({ error: "Not logged in" });
  }

  res.json(req.session.bruger);
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Could not log out:", error);
      return res.status(500).json({ error: "server error" });
    }

    res.clearCookie("connect.sid", { path: "/" });
    res.sendStatus(204);
  });
});

function krævLogin(req, res, next) {
  if (!req.session.bruger) {
    return res.status(401).json({ error: "Not logged in" });
  }

  next();
}

function krævSundhedsprofessionel(req, res, next) {
  if (!req.session.bruger) {
    return res.status(401).json({ error: "Not logged in" });
  }
  if (req.session.bruger.patient_id != null) {
    return res.status(403).json({ error: "Healthcare professional access required" });
  }
  next();
}

function krævPatientAdgang(req, res, next) {
  if (!req.session.bruger) {
    return res.status(401).json({ error: "Not logged in" });
  }
  const patientId = Number(req.params.id);
  if (!Number.isInteger(patientId)) {
    return res.status(400).json({ error: "Invalid patient id" });
  }
  if (
    req.session.bruger.patient_id != null &&
    patientId !== req.session.bruger.patient_id
  ) {
    return res.status(403).json({ error: "You can only access your own patient data" });
  }
  next();
}

// Returnerer patientlisten til sundhedsprofessionelle.
app.get("/api/patients", krævSundhedsprofessionel, async (req, res) => {
  try {
    const liste = await patients.hentPatienter();
    res.json(liste);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Returnerer én patients målinger, sorteret efter tidspunkt.
app.get("/api/patients/:id/maalinger", krævPatientAdgang, async (req, res) => {
  try {
    const maalinger = await patients.hentMaalinger(req.params.id);
    res.json(maalinger);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "database error" });
  }
});

// Returnerer én patients symptomer, sorteret efter tidspunkt.
app.get("/api/patients/:id/symptomer", krævPatientAdgang, async (req, res) => {
  try {
    const liste = await symptomer.hentSymptomer(req.params.id);
    res.status(200).json(liste);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "database error" });
  }
});

// Returnerer én patient ud fra CPR-nummeret til sundhedsprofessionelle.
app.get("/api/patients/:cpr", krævSundhedsprofessionel, async (req, res) => {
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
app.post("/api/patients", krævSundhedsprofessionel, async (req, res) => {
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
app.get("/api/symptomer", krævSundhedsprofessionel, async (req, res) => {
  try {
    const liste = await symptomer.hentAlleSymptomer();
    res.status(200).json(liste);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "database error" });
  }
});

// Gemmer et nyt symptom i tabellen symptomer.
app.post("/api/symptomer", krævLogin, async (req, res) => {
  const { patient_id, tidspunkt, beskrivelse } = req.body ?? {};

  // Tjekker felterne FØR databasen. Tom tekst eller kun mellemrum tæller som manglende.
  if (!patient_id || !String(tidspunkt ?? "").trim() || !String(beskrivelse ?? "").trim()) {
    return res.status(400).json({ error: "patient_id, tidspunkt and beskrivelse are required" });
  }

  // Tjekker at patient_id er et helt tal, fx 1 og ikke "abc"
  if (!Number.isInteger(Number(patient_id))) {
    return res.status(400).json({ error: "Invalid patient id" });
  }
  if (
    req.session.bruger.patient_id != null &&
    Number(patient_id) !== req.session.bruger.patient_id
  ) {
    return res.status(403).json({ error: "You can only report symptoms for your own patient account" });
  }

  // Tjekker formatet: præcis "ÅÅÅÅ-MM-DD TT:MM", fx "2026-11-10 14:30". Stopper fx år 00000.
  const formatOk = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(tidspunkt);
  if (!formatOk) {
    return res.status(400).json({ error: "Date and time must look like 2026-11-10 14:30" });
  }

  // Laver teksten om til et rigtigt tidspunkt. Ugyldige værdier (fx kl. 25:00) giver NaN.
  const valgtTidspunkt = new Date(tidspunkt.replace(" ", "T"));
  if (isNaN(valgtTidspunkt.getTime())) {
    return res.status(400).json({ error: "Invalid date or time" });
  }

  // Tjekker at datoen findes. Fx bliver 31/2 ellers lavet om til 3/3.
  if (valgtTidspunkt.getDate() !== Number(tidspunkt.slice(8, 10))) {
    return res.status(400).json({ error: "Invalid date or time" });
  }

  // Tjekker at tidspunktet ikke ligger i fremtiden
  const nu = new Date();
  if (valgtTidspunkt > nu) {
    return res.status(400).json({ error: "The date and time cannot be in the future." });
  }

  // Tjekker at tidspunktet højst er 14 dage gammelt (samme periode som History)
  const graense = new Date();
  graense.setDate(nu.getDate() - 14);
  if (valgtTidspunkt < graense) {
    return res.status(400).json({ error: "You can only report symptoms from the last 14 days." });
  }

  try {
    const symptom = await symptomer.opretSymptom(patient_id, tidspunkt, beskrivelse.trim());
    res.status(201).json(symptom);
  } catch (err) {
    // Fejlkode 23503 betyder, at patienten ikke findes i tabellen patients
    if (err.code === "23503") {
      return res.status(400).json({ error: "Patient not found" });
    }
    console.error(err);
    res.status(500).json({ error: "database error" });
  }
});

// Sidste middleware: returnerer JSON med status 404 for ukendte adresser.
app.use((req, res) => {
  res.status(404).json({ error: "not found" });
});

// Starter serveren på port 3000.
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

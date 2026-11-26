const express = require("express");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const bcrypt = require("bcryptjs");

// Dansk tid, så tidspunkter passer på Vercel (der kører i UTC)
process.env.TZ = "Europe/Copenhagen";

// Repository-filer med al SQL
const patients = require("./patients");
const symptomer = require("./symptomer");
const brugere = require("./brugere");

const app = express();
// Vercel ligger bag en proxy, ellers virker sikre cookies ikke
app.set("trust proxy", 1);
const sessionSecret = process.env.SESSION_SECRET;

// Stopper serveren, hvis SESSION_SECRET mangler
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set in .env.");
}

// Tillader kald til API'et fra andre adresser (CORS)
app.use(cors());

app.use(express.json());
// Login-session gemt i tabellen session, cookien udløber efter 1 time
app.use(
  session({
    store: new PgSession({connectionString: process.env.DATABASE_URL}),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: Boolean(process.env.VERCEL),
      maxAge: 60 * 60 * 1000,
    },
  })
);

// Leverer HTML, CSS og JS fra mappen public
app.use(express.static("public"));

// Sender login-siden, når man åbner /
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Logger brugeren ind og gemmer brugeren i sessionen
app.post("/api/login", async (req, res) => {
  const brugernavn =
    typeof req.body?.brugernavn === "string" ? req.body.brugernavn.trim() : "";
  const password =
    typeof req.body?.password === "string" ? req.body.password : "";

  if (!brugernavn || !password) {
    return res.status(400).json({ error: "E-mail and password are required" });
  }

  try {
    // Sammenligner password med bcrypt-hashen fra databasen
    const bruger = await brugere.findBruger(brugernavn);
    if (!bruger || !(await bcrypt.compare(password, bruger.password_hash))) {
      return res.status(401).json({ error: "Invalid e-mail or password" });
    }

    // Ny session-id ved login
    req.session.regenerate((error) => {
      if (error) {
        console.error("Could not create login session:", error);
        return res.status(500).json({ error: "server error" });
      }

      // Brugere uden patient_id er sundhedsprofessionelle
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

// Returnerer den bruger, der er logget ind
app.get("/api/me", kraevLogin, (req, res) => {
  res.json(req.session.bruger);
});

// Logger ud: sletter sessionen og cookien
app.post("/api/logout", kraevLogin, (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Could not log out:", error);
      return res.status(500).json({ error: "server error" });
    }

    res.clearCookie("connect.sid", { path: "/" });
    res.sendStatus(204);
  });
});

// Afviser kaldet med 401, hvis brugeren ikke er logget ind
function kraevLogin(req, res, next) {
  if (!req.session.bruger) {
    return res.status(401).json({ error: "Not logged in" });
  }

  next();
}

// Kun sundhedsprofessionelle (uden patient_id) får adgang
function kraevSundhedsprofessionel(req, res, next) {
  if (req.session.bruger.patient_id != null) {
    return res.status(403).json({ error: "Healthcare professional access required" });
  }
  next();
}

// En patient må kun se sine egne data
function kraevPatientAdgang(req, res, next) {
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

// Henter alle patienter
app.get("/api/patients", kraevLogin, kraevSundhedsprofessionel, async (req, res) => {
  try {
    const liste = await patients.hentPatienter();
    res.json(liste);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "database error" });
  }
});

// Henter én patients målinger for de seneste 14 dage
app.get("/api/patients/:id/maalinger", kraevLogin, kraevPatientAdgang, async (req, res) => {
  try {
    const maalinger = await patients.hentMaalingerSeneste14Dage(req.params.id);
    res.json(maalinger);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "database error" });
  }
});

// Henter én patients symptomer
app.get("/api/patients/:id/symptomer", kraevLogin, kraevPatientAdgang, async (req, res) => {
  try {
    const liste = await symptomer.hentSymptomer(req.params.id);
    res.json(liste);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "database error" });
  }
});

// Henter én patient ud fra CPR-nummeret
app.get("/api/patients/:cpr", kraevLogin, kraevSundhedsprofessionel, async (req, res) => {
  try {
    const patient = await patients.hentPatientMedCpr(req.params.cpr);
    if (!patient) {
      return res.status(404).json({ error: "not found" });
    }
    res.json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "database error" });
  }
});

// Opretter en ny patient
app.post("/api/patients", kraevLogin, kraevSundhedsprofessionel, async (req, res) => {
  const { cpr, navn } = req.body ?? {};
  if (!cpr || !navn) {
    return res.status(400).json({ error: "cpr and name are required" });
  }
  try {
    const patient = await patients.opretPatient(cpr, navn);
    res.status(201).json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "database error" });
  }
});

// Henter alle symptomer fra alle patienter
app.get("/api/symptomer", kraevLogin, kraevSundhedsprofessionel, async (req, res) => {
  try {
    const liste = await symptomer.hentAlleSymptomer();
    res.json(liste);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "database error" });
  }
});

// Opretter et nyt symptom
app.post("/api/symptomer", kraevLogin, async (req, res) => {
  const { patient_id, tidspunkt, beskrivelse } = req.body ?? {};

  // Tomme felter eller kun mellemrum giver 400
  if (!patient_id || !String(tidspunkt ?? "").trim() || !String(beskrivelse ?? "").trim()) {
    return res.status(400).json({ error: "patient_id, tidspunkt and beskrivelse are required" });
  }

  // patient_id skal være et helt tal
  if (!Number.isInteger(Number(patient_id))) {
    return res.status(400).json({ error: "Invalid patient id" });
  }
  // En patient må kun melde symptomer for sig selv
  if (
    req.session.bruger.patient_id != null &&
    Number(patient_id) !== req.session.bruger.patient_id
  ) {
    return res.status(403).json({ error: "You can only report symptoms for your own patient account" });
  }

  // Tidspunktet skal have formatet ÅÅÅÅ-MM-DD TT:MM
  const formatOk = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(tidspunkt);
  if (!formatOk) {
    return res.status(400).json({ error: "Date and time must look like 2026-11-10 14:30" });
  }

  // Ugyldige tidspunkter, fx kl. 25:00, giver NaN
  const valgtTidspunkt = new Date(tidspunkt.replace(" ", "T"));
  if (isNaN(valgtTidspunkt.getTime())) {
    return res.status(400).json({ error: "Invalid date or time" });
  }

  // Afviser datoer, der ikke findes, fx 31/2
  if (valgtTidspunkt.getDate() !== Number(tidspunkt.slice(8, 10))) {
    return res.status(400).json({ error: "Invalid date or time" });
  }

  // Tidspunktet må ikke ligge i fremtiden
  const nu = new Date();
  if (valgtTidspunkt > nu) {
    return res.status(400).json({ error: "The date and time cannot be in the future." });
  }

  // Tidspunktet må højst være 14 dage gammelt
  const graense = new Date();
  graense.setDate(nu.getDate() - 14);
  if (valgtTidspunkt < graense) {
    return res.status(400).json({ error: "You can only report symptoms from the last 14 days." });
  }

  try {
    const symptom = await symptomer.opretSymptom(patient_id, tidspunkt, beskrivelse.trim());
    res.status(201).json(symptom);
  } catch (err) {
    // Fejlkode 23503: patienten findes ikke i tabellen patients
    if (err.code === "23503") {
      return res.status(400).json({ error: "Patient not found" });
    }
    console.error(err);
    res.status(500).json({ error: "database error" });
  }
});

// Svarer 404 for ukendte adresser
app.use((req, res) => {
  res.status(404).json({ error: "not found" });
});

// Starter serveren på PORT eller 3000
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

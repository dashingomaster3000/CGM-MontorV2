# Ændringer på branchen M-II

Denne fil viser alle ændringer på branchen `M-II` i forhold til `main`, side for side.
Hver ændring har sin egen commit (`M-II: <side> – <hvad>`), og i koden er hver ændring
markeret med en kommentar, der starter med `M-II:`. Søg efter `M-II:` i projektet for at finde dem.

Fælles grænser på alle sider: **Low = under 3.9 mmol/L**, **High = over 10.0 mmol/L**.

**Datakilder (gruppens beslutning):**
- **Dashboard** viser et dagsbillede fra CGM-sensoren: filen `public/Forside/sample-glucose.json`. *Alt* på dashboardet (graf, Current glucose, Average, Time in range, Readings, hændelser, mønster og tidsrum) beregnes ud fra de samme målinger, som grafen viser.
- **History** viser de målinger, der er gemt i Neon-databasen (de seneste 14 dage).
- De to sider behøver ikke at vise de samme data. En mulig udvidelse: dagens grafdata uploades til Neon, så gårsdagens graf bliver en del af History næste dag.

---

## Navigation / header

### Rækkefølge i menuen
- **Før:** Report symptoms, Dashboard, History, [email], Log out
- **Nu:** Dashboard, Report symptoms, History, [email], Log out
- **Filer:** `public/Forside/Forside.html`, `public/History/History.html`, `public/Feedback/MeldSymptomer.html` (kun `<nav>`)
- **Hvorfor:** Feedback: Dashboard skal stå først, fordi det er hovedsiden.

---

## Dashboard / forside

### Alle tal bygger på grafens data
- **Før:** Grafen blev tegnet fra `sample-glucose.json`, mens Current glucose, Average, Time in range, Readings, Low glucose events og Pattern overview kom fra Neon-databasen. Tallene under grafen passede derfor ikke til punkterne i grafen.
- **Nu:** Dashboardet henter kun `sample-glucose.json`, og alt beregnes ud fra den dag, grafen viser (15 readings, gennemsnit 5.9 mmol/L, 67 % time in range, 4 Low + 1 High). "Import data" virker som før og opdaterer hele dashboardet.
- **Filer:** `public/Forside/Forside.js` (`renderDashboard()`, `hentData()`; `patientId` er fjernet, fordi den ikke længere bruges)
- **Hvorfor:** Feedback: Tallene og farverne under grafen skal hænge sammen med grafen.

### Low/High-labels på grafen
- **Før:** Alle punkter var blå uden tekst. De røde zoner gik fra 4 og 10 (ikke de samme grænser som resten af appen).
- **Nu:** Punkter under 3.9 er røde med teksten **"Low"**, punkter over 10.0 er røde med **"High"**. Zonerne følger de fælles grænser 3.9/10.0.
- **Filer:** `public/Forside/Forside.js` (`renderChart()`; ligger to mærkede punkter tæt, skrives hver anden tekst under punktet, så de ikke overlapper), `public/Forside/Forside.css` (`.chart-point.low/.high`, `.chart-point-label`)
- **Hvorfor:** Feedback: Det skal være tydeligt, hvilke punkter der er lave/høje. Dagsfilen har 4 lave punkter (3.7, 3.4, 3.8, 3.8) og 1 højt (10.4 kl. 16:00), så grafen viser **5 markerede readings: 4×Low og 1×High**.

### Forklaring af "readings"
- **Før:** Det stod ikke, hvad en "reading" er.
- **Nu:** Under grafens farveforklaring står: *"Each reading is a glucose measurement from the CGM sensor (mmol/L)."* Den røde farveforklaring hedder nu "Dangerous glucose (Low / High)".
- **Filer:** `public/Forside/Forside.html`, `public/Forside/Forside.css` (`.chart-note`)
- **Hvorfor:** Feedback: Brugeren forstod ikke ordet "readings".

### Tidsrum nederst på dashboardet
- **Før:** Det stod ingen steder, hvilken periode dataene dækker.
- **Nu:** Nederst står *"Showing data from 06.11.2026 00:00 to 06.11.2026 23:00"* (første og sidste måling i grafen).
- **Filer:** `public/Forside/Forside.html` (`#dataPeriod`), `public/Forside/Forside.js` (`renderDashboard()`), `public/Forside/Forside.css` (`.data-period`)
- **Hvorfor:** Feedback: Det skal være tydeligt, hvilken periode tallene gælder for.

### Større tekst
- **Før:** Overskrifter 20–30px, tal 18–32px, labels 12–14px.
- **Nu:** Grundtekst 17px, overskrifter 24–34px, tal 24–38px, labels 14–16px. Samme stil og farver som før.
- **Filer:** `public/Forside/Forside.css`
- **Hvorfor:** Feedback: Teksten på dashboardet var for lille.

### Farvesammenhæng mellem graf og tal
- **Før:** Tallene under grafen og hændelseskortene var grå/sorte, og hændelseskortene havde grå baggrund.
- **Nu:** Én rød (`#b42318`, samme som grafens røde punkter) og én grøn (`#2e7d4f`, mørkere udgave af grafens grønne zone).
  - "Time in range" står med **grøn** tekst.
  - "Readings" står med **rød** tekst.
  - "Lowest/Highest: x mmol/L" i hændelseskortene er **rød**.
  - "Most frequent low period" er **rød**.
  - Lave/høje hændelser har samme lyserøde baggrund (`#fce8e6`) som grafens røde zone, og History-sidens lave rækker bruger den samme baggrund.
- **Filer:** `public/Forside/Forside.html` (klasserne `in-range`/`readings`), `public/Forside/Forside.css` (`:root`-farver, `.summary`, `.event-card`, `.period`), `public/History/History.css` (`tr.low`, `tr.high`)
- **Hvorfor:** Feedback: Farverne i grafen og teksten under grafen skal hænge sammen.

### "Low glucose events"-kortet
- **Før:** Overskriften var "Low glucose events". Kortet viste kun lave hændelser fra *alle* målinger i databasen (højst 6), med grå "Lowest".
- **Nu:** Overskriften er **"Low glucose events today"**. Kortet viser lave **og** høje hændelser fra grafens dag, med rød "Lowest"/"Highest": lav 03:00–04:00 (3.4), høj 16:00 (10.4), lav 22:00 (3.8). Lave målinger inden for 30 min er samlet til én hændelse (03:00, 03:30 og 04:00).
- **Bemærk:** Feedbacken bad om "past 2 weeks", men da dashboardet nu kun viser dagens data, ville det være forkert. Derfor står der "today".
- **Filer:** `public/Forside/Forside.html`, `public/Forside/Forside.js` (`renderLowEvents()`)
- **Hvorfor:** Feedback: Det skal fremgå, hvilken periode kortet dækker, og farven skal matche grafen.

### Datoer og tid
- **Før:** Browserens eget format (fx `8/11/2026` eller `11/8/2026` og `6:00 AM`, afhængigt af computeren).
- **Nu:** Altid `08.11.2026` og `06:00` (24-timers ur, dansk tid `Europe/Copenhagen`).
- **Filer:** Ny fil `public/Assets/Glukose.js` (`formatDato()`, `formatTid()`, `formatDatoTid()`), `public/Forside/Forside.js` (`formatTime()`, `formatDateTime()`, `renderLowEvents()`)
- **Hvorfor:** Feedback: Samme dato- og tidsformat alle steder.

---

## History

### Samme grænser og regler som Dashboardet
Dashboard (dagens JSON-data) og History (Neon) viser bevidst **ikke** de samme målinger (se "Datakilder" øverst). Men de bruger nu de samme grænser, den samme måde at finde lave/høje hændelser på og det samme dato/tid-format.

- **Før:** History og Dashboard viste ikke de samme lave perioder. **Årsagen var:**
  1. **Forskellige data og perioder:** Dashboardets graf kom fra JSON-filen, men dets kort brugte *alle* målinger i databasen. History brugte "de sidste 7/14 dage *med målinger*" (`days.slice(-dayCount)`). Det er ikke det samme som kalenderdage, så der kunne være flere eller færre dage med.
  2. **Forskellig logik:** Dashboardet samlede lave målinger inden for 30 min til én hændelse. History talte hver lav måling for sig. Ingen af siderne viste høje målinger.
  3. **Grænserne stod to steder:** `3.9`/`10` var skrevet direkte i `Forside.js`, mens History havde sine egne konstanter.
- **Nu:**
  - History henter fra én repository-funktion, `hentMaalingerSeneste14Dage()` i `patients.js` (via `GET /api/patients/:id/maalinger`). Den henter den nyeste dag og 13 dage tilbage, regnet fra patientens nyeste måling.
  - Dashboard og History bruger de **samme grænser** (`GLUKOSE_LAV`, `GLUKOSE_HOEJ`) og den **samme funktion** `findHaendelser()` fra `public/Assets/Glukose.js`.
  - History har fået en ny tabel, **"Low and high glucose events"**, der er bygget på samme måde som Dashboardets kort (dato, tid, type, værdi).
  - 7/14 days er nu kalenderdage fra nyeste måling, og **14 days er valgt fra start**.
- **Filer:** `patients.js` (`hentMaalingerSeneste14Dage()`, erstatter `hentMaalinger()`), `server.js` (route `/api/patients/:id/maalinger`), `public/Assets/Glukose.js` (`findHaendelser()`), `public/History/History.js` (`showHistory()`, `daysInPeriod()`, `showEvents()`, `loadData()`), `public/History/History.html` (ny sektion + 14 days valgt)
- **Hvorfor:** Feedback: Dashboard og History skal vise de samme lavperioder.

### Datoer og tid
- **Før:** Datoer som `2026-11-08`, symptomer som `2026-11-04 08:30`.
- **Nu:** `08.11.2026`, symptomer som `04.11.2026 08:30`. Samme fælles funktioner som Dashboardet.
- **Filer:** `public/History/History.js` (`showHistory()`, `showSymptoms()`), `public/History/History.html` (indlæser `Glukose.js`)
- **Hvorfor:** Feedback: Samme dato- og tidsformat alle steder.

### Baggrund for lave målinger
- **Før:** `#ffdddd`
- **Nu:** `#fce8e6`, samme som grafens røde zone og Dashboardets hændelseskort. Høje hændelser får samme farve.
- **Filer:** `public/History/History.css`
- **Hvorfor:** Feedback: Lave readings skal se ens ud overalt.

---

## Login

**Ikke ændret.** Tjekket: `index.html`, `Login/Login.js` og `Login/Auth.js` er uændrede. Login virker som før.

---

## Report symptoms

### Afstand mellem overskrift og tekst
- **Før:** Der var stor afstand mellem "Report symptoms" og "Here you can report your symptoms:".
- **Nu:** Teksten står lige under overskriften. Det er kun CSS, logikken i `MeldSymptomer.js` er ikke rørt.
- **Filer:** `public/Assets/Diabeto.css` (`.meld-symptomer-page .kort h1`, `.kort h1 + p`)
- **Hvorfor:** Feedback: Teksten skulle stå tættere på overskriften.

Menuen er også byttet om (se Navigation). Datofeltet er browserens eget `<input type="date">` og er ikke ændret.

---

## Patientliste

### Fuldt CPR-nummer
- **Før:** CPR blev vist maskeret, fx `251248-xxxx`.
- **Nu:** Hele CPR-nummeret vises, fx `2512489996`.
- **Filer:** `public/Patients/Patients.js` (`hideCpr()` fjernet, `showPatients()`)
- **Hvorfor:** Feedback: Den sundhedsprofessionelle skal kunne se hele CPR-nummeret. Alle CPR-numre i databasen er **syntetiske testnumre** fra `seed.sql` (navnene indeholder "Test").

---

## Backend / database

### Én repository-funktion for de 14 dage
Se History ovenfor (`hentMaalingerSeneste14Dage()` i `patients.js`). Dashboardet bruger den ikke længere.

### Syntetiske testdata: 4 low + 1 high
- **Før:** Nancys seneste 14 dage havde 4 lave målinger (3.4, 3.6, 3.2, 3.7) og 2 målinger lige over 10 (10.5 og 10.6).
- **Nu:** De to målinger lige over 10 er sænket til 9.8 og 9.6, og der er tilføjet **én** tydeligt forhøjet måling (13.2 mmol/L kl. 15:00, 3 dage før nyeste måling). Resultat: **4 low + 1 high = 5 hændelser**.
- **Filer:**
  - `patients.js`: nye repository-funktioner `opretMaaling()` og `aendrMaaling()` med pladsholdere `$1, $2, $3`.
  - `m2-testdata.js`: script, der bruger funktionerne. `node m2-testdata.js` viser kun, hvad der ville ske. `node m2-testdata.js --udfoer` gemmer i databasen.
  - `seed.sql`: samme ændring, så en ny database får de samme data.
- **Hvorfor:** Feedback: Testdataene skal have 5 hændelser, hvoraf én er forhøjet. Ingen værdier er skrevet fast i frontend.

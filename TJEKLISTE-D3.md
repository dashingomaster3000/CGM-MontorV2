# D3-tjekliste – Diabeto (CGM-MontorV2)

Gennemgået på branchen `M-II` den 26.11.2026.

- **OK**: opfyldt og tjekket (hvordan står ved punktet).
- **IKKE OK**: mangler eller virker ikke.
- **TJEK MANUELT**: kan kun tjekkes af gruppen.

**Lokale tests:** `node server.js` og derefter curl mod alle routes (logget ud, som patient og som sundhedsprofessionel). Browsertest i Edge: login, alle sider, Report symptoms, genindlæsning og log ud, med opsamling af fejl i konsollen.
**Live URL** (https://cgm-montorv2.vercel.app): kun GET uden login. Den kører stadig `main`, ikke `M-II`.

---

## 1. Systemet (lokalt + live URL)

| Status | Krav | Hvordan tjekket |
|---|---|---|
| OK | En side, der kræver login, sender til login-siden | Browser, logget ud: Forside, History, Patients og MeldSymptomer ender alle på `/index.html` (`public/Login/Auth.js` linje 8–11). |
| OK | En GET-route i adresselinjen svarer 401 uden login | curl lokalt: alle 6 GET-routes giver 401 `{"error":"Not logged in"}`. Live: `/api/patients` og `/api/me` giver 401. |
| OK | Man kan logge ind med testbrugeren | Browser og curl: `sundhed@diabeto.test` ender på patientlisten, og `nancy.berggren@diabeto.test` ender på Dashboard. |
| OK | Hver user story kan gennemføres, og data er der stadig efter genindlæsning | Browser: et meldt symptom kan ses i History og er der stadig efter genindlæsning. Patientliste og History virker. Dashboard gemmer ingen data (se afsnit 3). |
| OK | Log ud virker, og bagefter svarer GET-routen igen 401 | Browser: "Log out" sender til `/index.html`, og `/api/patients` giver derefter 401. curl: `POST /api/logout` giver 204, og næste kald giver 401. |
| TJEK MANUELT | GitHub-linket kan åbnes i et privat vindue (ellers skal cbudtz være collaborator) | |
| TJEK MANUELT | Koden på `main` er deployet, og login-branchen er merget | Live kører `main`. `M-II` er **ikke** merget endnu (`/Assets/Menu.js` giver 404 live). Efter merge skal den live URL tjekkes igen. |
| TJEK MANUELT | `DATABASE_URL` og `SESSION_SECRET` er sat i Vercel | Koden stopper, hvis `SESSION_SECRET` mangler (`server.js` linje 20–23). |
| TJEK MANUELT | Login holder på den live URL efter flere genindlæsninger og en pause | Cookien udløber efter 1 time (`server.js` linje 41). Sessionerne ligger i tabellen `session`. |
| IKKE OK | Hvert gruppemedlem har sin egen bruger + mindst én testbruger til underviserne | Tabellen `brugere` har kun testbrugere: 5 patienter (`*@diabeto.test`) og 1 sundhedsprofessionel (`sundhed@diabeto.test`). Der er ingen bruger pr. gruppemedlem. Testbrugere til underviserne findes. **Mangler:** en bruger pr. person i `seed.sql`, med bcrypt-hash. |

## 2. Kode og hemmeligheder

| Status | Krav | Hvordan tjekket |
|---|---|---|
| OK | `.env` er ikke i repoet og står i `.gitignore` | `git ls-files .env` og `git log --all -- .env` giver 0. `.gitignore` linje 2: `.env`. |
| OK | Ingen connection-string eller `SESSION_SECRET` i koden eller historikken | `git log --all -S "postgres://"`, `"postgresql://"`, `"npg_"` og `"neon.tech"` giver 0 commits. `-S "SESSION_SECRET"` finder kun navnet (`process.env.SESSION_SECRET` og tekst i dokumentation), aldrig en værdi. |
| OK (bemærk) | Passwords kun som bcrypt-hash i tabellen | Alle 6 rækker i `brugere` starter med `$2b$`. `seed.sql` indeholder kun hashes. **Bemærk:** `api.http` indeholder testbrugernes passwords i klartekst (bruges kun til test og er de samme, som underviserne får). |
| OK | Al SQL i repository-filer med pladsholdere | SQL findes kun i `patients.js`, `symptomer.js` og `brugere.js`. Alle værdier fra requests bruger `$1`, `$2`, `$3`. `server.js` indeholder ingen SQL. |
| OK | 201 / 400 / 500 | `POST /api/patients`: 400 (curl), 201 og 500. `POST /api/symptomer`: 400 (curl), 201 (browser) og 500. Fejlkode 23503 giver 400. Alle GET-routes svarer 500 `"database error"` ved fejl. **Bemærk:** et CPR-nummer, der allerede findes, giver 500 i stedet for 400. |
| OK | Alle routes, der læser eller ændrer data, har `kraevLogin` | Se listen over routes nedenfor. |
| OK | Login-state fra serveren, ikke localStorage | `grep -r localStorage` giver 0. Siderne kalder `GET /api/me` (`Auth.js` linje 8). |
| OK (bemærk) | Data er syntetiske | Navne indeholder "Test", CPR-numrene er testnumre, og målingerne kommer fra `seed.sql` og `sample-glucose.json`. **Bemærk:** tabellen `symptomer` indeholder testrækker som "elton john", "not good" og 3 × "Synthetic test (cleanup check)" fra testene. De er syntetiske, men bør ryddes op inden aflevering. |
| TJEK MANUELT | Alle har commits i deres egen user story | `git shortlog -sn --all`: Bardy-Dinho 57, dashingomaster3000 40, nilashammerum-jpg 20, malbertmalbertsen-beep 7, Matti 3. Gruppen skal selv koble git-navne til personer og user stories. |

### Routes
| Route | Middleware | Statuskoder |
|---|---|---|
| `POST /api/login` | – (åben) | 200, 400, 401, 500 |
| `GET /api/me` | `kraevLogin` | 200, 401 |
| `POST /api/logout` | `kraevLogin` | 204, 401, 500 |
| `GET /api/patients` | `kraevLogin`, `kraevSundhedsprofessionel` | 200, 401, 403, 500 |
| `GET /api/patients/:id/maalinger` | `kraevLogin`, `kraevPatientAdgang` | 200, 400, 401, 403, 500 |
| `GET /api/patients/:id/symptomer` | `kraevLogin`, `kraevPatientAdgang` | 200, 400, 401, 403, 500 |
| `GET /api/patients/:cpr` | `kraevLogin`, `kraevSundhedsprofessionel` | 200, 401, 403, 404, 500 |
| `POST /api/patients` | `kraevLogin`, `kraevSundhedsprofessionel` | 201, 400, 401, 403, 500 |
| `GET /api/symptomer` | `kraevLogin`, `kraevSundhedsprofessionel` | 200, 401, 403, 500 |
| `POST /api/symptomer` | `kraevLogin` | 201, 400, 401, 403, 500 |
| Ukendt adresse | – | 404 |

## 3. User stories

Udfyldt ud fra koden. Kolonnen "Ansvarlig" er et gæt ud fra git (branchnavne og commits) og skal rettes af gruppen.

| Ansvarlig (gæt fra git) | User story | Side | Route | Repository-funktion | Tabel |
|---|---|---|---|---|---|
| Matti? (`malbertmalbertsen-beep`: "graf done") | Som patient vil jeg se dagens glukose på et dashboard | `Forside/Forside.html`, `Forside.js` | **ingen**: læser den statiske fil `sample-glucose.json` | **ingen** | **ingen** |
| David? (`dashingomaster3000`, branch `meldsymptomer-david`) | Som patient vil jeg melde mine symptomer | `Feedback/MeldSymptomer.html`, `MeldSymptomer.js` | `POST /api/symptomer` | `symptomer.opretSymptom()` | `symptomer` |
| Bardy? (branch `History-Bardy`) | Som patient/sundhedsprofessionel vil jeg se målinger og symptomer for 7/14 dage | `History/History.html`, `History.js` | `GET /api/patients/:id/maalinger` (+ `/symptomer`) | `patients.hentMaalingerSeneste14Dage()` (+ `symptomer.hentSymptomer()`) | `maalinger` (+ `symptomer`) |
| Nilas? (login-commits) | Som sundhedsprofessionel vil jeg se en liste over patienter | `Patients/Patients.html`, `Patients.js` | `GET /api/patients` | `patients.hentPatienter()` | `patients` |

| Status | Krav | Kommentar |
|---|---|---|
| IKKE OK | Én user story pr. person, og hver person er ansvarlig for én | Ingen steder står, hvem der har hvilken. Afsnittet "User stories" i `PROJEKTLOG-login-url.md` er tomme skabeloner ("Som … vil jeg …"). |
| TJEK MANUELT | Den centrale brugerhandling fra D2 er én af dem | |
| OK | Login er fælles og ikke nogens user story | `POST /api/login` står som "Fælles / Alle" i `PROJEKTLOG-login-url.md`. |
| OK | Forskellige handlinger set fra brugeren | Se dashboard, meld symptom, se historik og se patientliste. |
| IKKE OK | Hver user story går gennem alle fire lag | **Dashboardet** går ikke gennem route, repository og tabel. Siden henter `sample-glucose.json` direkte (`Forside.js` linje 344). Det skete ved M-II-ændringen "alle tal fra grafens data". De tre andre user stories går gennem alle fire lag. |

## 4. Rapporten – TJEK MANUELT
- [ ] Forside: gruppenummer, navne og studienumre, live URL, GitHub-link og testbrugere
- [ ] AI-deklaration lige efter forsiden
- [ ] 1. Indledning, 2. Analyse
- [ ] 3. Design: tabel over user stories, sekvensdiagrammer (login og et kald, der kræver login), arkitekturdiagram og databasedesign
- [ ] 4. Implementering
- [ ] 5. Test: brugertest på live URL med mindst to personer uden for gruppen, heuristisk evaluering og et testskema pr. user story plus ét for login
- [ ] 6. Evaluering og diskussion
- [ ] Bilag: hvem gjorde hvad, krav fra D2-feedback og kilder
- [ ] Kravene fra D2-feedbacken er indfriet
- [ ] Rolfs Portfolio Checklist er gennemgået
- [ ] Rapporten er én sammenhængende tekst på ét sprog
- [ ] For hver user story: mindst tre acceptkriterier (normalt forløb, fejlforløb, kald uden login), et kort scenarie, implementering (side, route, repository-funktion, tabel) og et testskema fra den live URL med mindst én testcase pr. acceptkriterium

## 5. Forklaring til eksamen – TJEK MANUELT
- [ ] Hver person har forklaret sin user story højt, fra siden til tabellen, med koden åben
- [ ] Hver person kan forklare login: hvad der står i cookien, hvad der ligger på serveren, og hvordan et kald uden login bliver afvist

**Sådan virker login i koden:**
1. `public/index.html` og `public/Login/Login.js` sender e-mail og password med `fetch` til `POST /api/login`.
2. `server.js` henter brugeren med `brugere.findBruger()` (`SELECT … WHERE brugernavn = $1`) og sammenligner passwordet med `bcrypt.compare()` mod `password_hash`.
3. Passer passwordet, laver `req.session.regenerate()` en ny session, og `{ id, brugernavn, patient_id, role }` gemmes i `req.session.bruger`.
4. `express-session` gemmer sessionen i tabellen `session` i Neon (via `connect-pg-simple`). Browseren får kun cookien `connect.sid` med et signeret session-id (HttpOnly, SameSite=Lax, Secure på Vercel, 1 time). Der står ingen brugerdata i cookien.
5. Hver side indlæser `public/Login/Auth.js`, som kalder `GET /api/me`. Ved 401 sendes brugeren til `/index.html`.
6. Alle data-routes starter med `kraevLogin`. Findes `req.session.bruger` ikke, svarer serveren `401 {"error":"Not logged in"}`. Bagefter giver `kraevSundhedsprofessionel` og `kraevPatientAdgang` 403 ved forkert rolle.
7. Log ud: `POST /api/logout` kalder `req.session.destroy()` og `res.clearCookie("connect.sid")`.

## 6. Aflevering – TJEK MANUELT
- [ ] Rapporten som én PDF med forsiden forrest og AI-deklarationen lige efter
- [ ] Koden som ét zip-arkiv af `main`, uden `node_modules` og `.env`
- [ ] Live URL, GitHub-link og testbrugere står i afleveringskommentaren på Learn
- [ ] Koden fryses den: ______
- [ ] Aftalt, hvem der tjekker den live URL efter afleveringen og igen dagen før eksamen

---

## Fundne fejl (IKKE OK), sorteret efter vigtighed

1. **Dashboardet går ikke gennem alle fire lag.** `Forside.js` læser `sample-glucose.json` direkte. Der er ingen route, repository-funktion eller tabel. Hvis Dashboard er en persons user story, opfylder den ikke D3-kravet.
2. **Ingen bruger pr. gruppemedlem.** Tabellen `brugere` har kun testbrugere (`seed.sql`).
3. **User stories og ansvarlige er ikke skrevet ned.** Afsnittene i `PROJEKTLOG-login-url.md` er tomme.
4. **Neon-dataene passer ikke til `AENDRINGER-M-II.md`.** Nancy har 56 målinger med 10.5 og 10.6, og der er ingen måling på 13.2. History viser derfor 4 lave og 2 høje i stedet for 4 + 1. `m2-testdata.js --udfoer` er ikke kørt mod databasen.
5. **History og Report symptoms bruger `?patient=` fra adressen, ikke `patient_id` fra `/api/me`.** Se `History.js` linje 5 og `MeldSymptomer.js` linje 8. Uden `?patient=` bruges patient 1, så en anden patient får 403. History viser så "Could not connect to the server", og Report symptoms viser "Could not save the symptom". Serveren beskytter stadig dataene. Fundet ved gennemlæsning og ikke testet, fordi der kun er password til Nancy.
6. **Testrækker i tabellen `symptomer`** ("elton john", "not good", 3 × "Synthetic test (cleanup check)") bør ryddes op inden aflevering.

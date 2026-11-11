# CGM-MontorV2

## Login på `Lektion19-Login`

Login understøtter sundhedsprofessionelle og fem syntetiske testpatienter.
Patientkonti er koblet til hver sin patient og kan kun se egne målinger og
symptomer. Brug aldrig rigtige patientoplysninger.

1. Tilføj en lokal `SESSION_SECRET` i `.env`:

   ```sh
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Kopiér resultatet til `.env` som `SESSION_SECRET=...`. Del eller commit ikke
   `.env`.

2. Kør hele `schema.sql` i en tom database. Hvis tabellerne allerede findes,
   kør kun `ALTER TABLE`- og `CREATE UNIQUE INDEX`-delen for `brugere`, så
   patientkonti kan knyttes til patienter.

3. `seed.sql` opretter også en syntetisk sundhedsprofessionel til lokal test:

   - E-mail: `sundhed@diabeto.test`
   - Adgangskode: `Sundhed-Demo-26!`

   Kontoen kan søge på patientlisten og åbne patientens dashboard eller
   historik. Hvis I vil oprette flere professionelle konti, generér et hash:

   ```sh
   node -e "require('bcryptjs').hash('DIT-SYNTHETIC-TEST-PASSWORD', 10).then(console.log)"
   ```

   Indsæt hashværdien i Neon SQL Editor med en separat `.test`-e-mail:

   ```sql
   INSERT INTO brugere (brugernavn, password_hash)
   VALUES ('sundhed@diabeto.test', '<bcrypt-hash>')
   ON CONFLICT (brugernavn)
   DO UPDATE SET password_hash = EXCLUDED.password_hash;
   ```

   Udskift e-mail og `<bcrypt-hash>` med jeres testværdier. Gem aldrig
   adgangskoder i klartekst eller i Git.

4. Kør `seed.sql` for at indsætte de fem syntetiske patienter, deres målinger
   og tilhørende patientkonti. Hver patient har sin egen syntetiske testkode.
   `seed.sql` gemmer kun bcrypt-hashes med individuelt genererede salts,
   inklusive den professionelle testkonto:

   | Rolle | Testlogin |
   | --- | --- |
   | Sundhedsprofessionel | `sundhed@diabeto.test` / `Sundhed-Demo-26!` |

   Patientkonti:

   | Patient | Testlogin |
   | --- | --- |
   | Nancy Ann Test Berggren | `nancy.berggren@diabeto.test` / `Nancy-Demo-26!` |
   | Max Test Berggren | `max.berggren@diabeto.test` / `Max-Demo-26!` |
   | Kirsten Test Berggren | `kirsten.berggren@diabeto.test` / `Kirsten-Demo-26!` |
   | Brita Test Berggren | `brita.berggren@diabeto.test` / `Brita-Demo-26!` |
   | Anders Test Jensen | `anders.jensen@diabeto.test` / `Anders-Demo-26!` |

   Disse offentlige koder er kun til syntetiske testkonti og må ikke genbruges
   til rigtige konti. `seed.sql` er idempotent for de samme patientkonti.

5. Start lokalt med `npm run dev`. Login, rollebegrænsninger, `/api/me` og
   logout kan testes fra `api.http`. REST Client skal beholde cookien mellem
   requests. En patientkonto lander på sit dashboard; sundhedsprofessionelle
   lander på patientlisten, kan søge på navn eller CPR og åbne den valgte
   patients dashboard eller historik.

Patientkonti kan kun læse egne målinger og symptomer og kun rapportere symptomer
for sig selv. Patientlisten, CPR-opslag og oprettelse af patienter er forbeholdt
sundhedsprofessionelle. Lokale sessions bruger Express' standard MemoryStore;
før deployment skal sessionslager og `SESSION_SECRET` sættes op til
deploymentmiljøet.

# CGM-MontorV2

## Login på `Lektion19-Login`

Login i prototypen er for sundhedsprofessionelle. Opret én syntetisk konto pr.
gruppemedlem med hver sin `.test`-e-mail. Borgerkonti koblet til patienter
tilføjes senere; opret ikke konti med rigtige personoplysninger.

1. Tilføj en lokal `SESSION_SECRET` i `.env`:

   ```sh
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Kopiér resultatet til `.env` som `SESSION_SECRET=...`. Del eller commit ikke
   `.env`.

2. Kør `CREATE TABLE brugere`-delen fra `schema.sql` i gruppens Neon-database,
   hvis tabellen ikke allerede findes.

3. Generér et hash til en syntetisk testadgangskode:

   ```sh
   node -e "require('bcryptjs').hash('DIT-SYNTHETIC-TEST-PASSWORD', 10).then(console.log)"
   ```

   Indsæt hashværdien i Neon SQL Editor. Brug et syntetisk login, fx
   `sundhed@diabeto.test`:

   ```sql
   INSERT INTO brugere (brugernavn, password_hash)
   VALUES ('sundhed@diabeto.test', '<bcrypt-hash>')
   ON CONFLICT (brugernavn)
   DO UPDATE SET password_hash = EXCLUDED.password_hash;
   ```

   Udskift `<bcrypt-hash>` med hashværdien, og brug den samme syntetiske
   adgangskode i `api.http`. Hver gruppemedlem skal bruge sin egen konto;
   gem aldrig adgangskoder i klartekst eller i Git.

4. Start lokalt med `npm run dev`. Login, `GET /api/me` og logout testes fra
   `api.http`. REST Client skal beholde cookien mellem requests.

Siderne validerer sessionen med `GET /api/me`, og ændrende patient- og
symptomrequests kræver login. Lokale sessions bruger Express' standard
MemoryStore; før deployment skal sessionslager og `SESSION_SECRET` sættes op til
deploymentmiljøet. Når borger-login tilføjes, brug kun realistiske, syntetiske
patienter og fiktive e-mailadresser under `.test`, koblet via `patient_id`.

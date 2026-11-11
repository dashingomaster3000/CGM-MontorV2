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

3. Generér et hash til en syntetisk testadgangskode:

   ```sh
   node -e "require('bcryptjs').hash('DIT-SYNTHETIC-TEST-PASSWORD', 10).then(console.log)"
   ```

   Indsæt hashværdien i Neon SQL Editor. Brug fx
   `sundhed@diabeto.test`:

   ```sql
   INSERT INTO brugere (brugernavn, password_hash)
   VALUES ('sundhed@diabeto.test', '<bcrypt-hash>')
   ON CONFLICT (brugernavn)
   DO UPDATE SET password_hash = EXCLUDED.password_hash;
   ```

   Udskift `<bcrypt-hash>` med hashværdien, og brug den samme syntetiske
   adgangskode i `api.http`. Sundhedsprofessionelle kan fortsat bruge hver sin
   `.test`-konto.

4. Kør `seed.sql` for at indsætte de fem syntetiske patienter, deres målinger
   og tilhørende patientkonti. Alle patientkonti bruger den syntetiske
   testkode `DiabetoTest2026!`:

   | Patient | Testlogin |
   | --- | --- |
   | Nancy Ann Test Berggren | `nancy.berggren@diabeto.test` |
   | Max Test Berggren | `max.berggren@diabeto.test` |
   | Kirsten Test Berggren | `kirsten.berggren@diabeto.test` |
   | Brita Test Berggren | `brita.berggren@diabeto.test` |
   | Anders Test Jensen | `anders.jensen@diabeto.test` |

   Koden er kun til syntetiske testkonti og må ikke genbruges til rigtige
   konti. `seed.sql` er idempotent for de samme patientkonti.

5. Start lokalt med `npm run dev`. Login, rollebegrænsninger, `/api/me` og
   logout kan testes fra `api.http`. REST Client skal beholde cookien mellem
   requests. En patientkonto lander på sit dashboard; sundhedsprofessionelle
   kan søge på navn eller CPR på patientlisten og åbne patientens historik.

Patientkonti kan kun læse egne målinger og symptomer og kun rapportere symptomer
for sig selv. Patientlisten, CPR-opslag og oprettelse af patienter er forbeholdt
sundhedsprofessionelle. Lokale sessions bruger Express' standard MemoryStore;
før deployment skal sessionslager og `SESSION_SECRET` sættes op til
deploymentmiljøet.

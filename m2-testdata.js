// M-II: Syntetiske testdata til D3. Køres manuelt fra terminalen:
//   node m2-testdata.js            -> viser kun, hvad der ville ske (ændrer intet)
//   node m2-testdata.js --udfoer   -> ændrer dataene i databasen
//
// Målet: Nancys seneste 14 dage skal have 4 lave målinger og præcis 1 høj måling.
// 1) Målinger over 10.0 (fx 10.5 og 10.6) sænkes til lige under 10, så de ikke tæller som High.
// 2) Én forhøjet måling (13.2 mmol/L) tilføjes kl. 15:00, 3 dage før nyeste måling.
// Al SQL ligger i patients.js og bruger pladsholdere ($1, $2, $3).

const patients = require("./patients");
const pool = require("./db");

const NANCY_CPR = "2512489996"; // syntetisk test-CPR fra seed.sql
const HOEJ_GRAENSE = 10.0;
const NY_HOEJ_VAERDI = 13.2;
const udfoer = process.argv.includes("--udfoer");

async function main() {
  const nancy = await patients.hentPatientMedCpr(NANCY_CPR);
  if (!nancy) throw new Error("Testpatienten findes ikke. Kør seed.sql først.");

  const maalinger = await patients.hentMaalingerSeneste14Dage(nancy.id);
  if (maalinger.length === 0) throw new Error("Nancy har ingen målinger.");

  // Tidspunktet for den nye høje måling: 3 dage før nyeste dag, kl. 15:00
  const nyeste = maalinger[maalinger.length - 1].tidspunkt;
  const dag = new Date(nyeste.slice(0, 10) + "T00:00:00Z");
  dag.setUTCDate(dag.getUTCDate() - 3);
  const nytTidspunkt = dag.toISOString().slice(0, 10) + " 15:00:00";

  console.log(`Patient ${nancy.id} (${nancy.navn}): ${maalinger.length} målinger, ${maalinger[0].tidspunkt} til ${nyeste}`);
  console.log("Lave:", maalinger.filter(m => Number(m.glukose_mmol) < 3.9).map(m => `${m.tidspunkt} ${m.glukose_mmol}`));

  // 1) Sænk eksisterende høje målinger (dog ikke den nye testmåling)
  const hoeje = maalinger.filter(m => Number(m.glukose_mmol) > HOEJ_GRAENSE && m.tidspunkt !== nytTidspunkt);
  let nyVaerdi = 9.8;
  for (const m of hoeje) {
    console.log(`${udfoer ? "Ændrer" : "Ville ændre"} ${m.tidspunkt}: ${m.glukose_mmol} -> ${nyVaerdi}`);
    if (udfoer) await patients.aendrMaaling(nancy.id, m.tidspunkt, nyVaerdi);
    nyVaerdi = Math.round((nyVaerdi - 0.2) * 10) / 10;
  }

  // 2) Tilføj den ene høje måling
  console.log(`${udfoer ? "Tilføjer" : "Ville tilføje"} ${nytTidspunkt}: ${NY_HOEJ_VAERDI} mmol/L`);
  if (udfoer) {
    const ny = await patients.opretMaaling(nancy.id, nytTidspunkt, NY_HOEJ_VAERDI);
    console.log(ny ? "Tilføjet." : "Fandtes allerede – intet ændret.");
  }
  if (!udfoer) console.log("\nIntet er ændret. Kør med --udfoer for at gemme.");
}

main()
  .catch(error => { console.error(error.message); process.exitCode = 1; })
  .finally(() => pool.end());

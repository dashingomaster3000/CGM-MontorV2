// Syntetiske testdata: 4 lave og 1 høj måling for testpatienten Nancy
// Kør "node m2-testdata.js" for at se ændringerne og tilføj --udfoer for at gemme dem

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

  // Den nye høje måling: 3 dage før nyeste dag kl. 15:00
  const nyeste = maalinger[maalinger.length - 1].tidspunkt;
  const dag = new Date(nyeste.slice(0, 10) + "T00:00:00Z");
  dag.setUTCDate(dag.getUTCDate() - 3);
  const nytTidspunkt = dag.toISOString().slice(0, 10) + " 15:00:00";

  console.log(`Patient ${nancy.id} (${nancy.navn}): ${maalinger.length} målinger, ${maalinger[0].tidspunkt} til ${nyeste}`);
  console.log("Lave:", maalinger.filter(m => Number(m.glukose_mmol) < 3.9).map(m => `${m.tidspunkt} ${m.glukose_mmol}`));

  // Sænker de eksisterende høje målinger til under 10
  const hoeje = maalinger.filter(m => Number(m.glukose_mmol) > HOEJ_GRAENSE && m.tidspunkt !== nytTidspunkt);
  let nyVaerdi = 9.8;
  for (const m of hoeje) {
    console.log(`${udfoer ? "Ændrer" : "Ville ændre"} ${m.tidspunkt}: ${m.glukose_mmol} -> ${nyVaerdi}`);
    if (udfoer) await patients.aendrMaaling(nancy.id, m.tidspunkt, nyVaerdi);
    nyVaerdi = Math.round((nyVaerdi - 0.2) * 10) / 10;
  }

  // Tilføjer én høj måling
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

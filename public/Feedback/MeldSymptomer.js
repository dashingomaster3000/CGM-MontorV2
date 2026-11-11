// Elementerne på siden
const form = document.getElementById("symptomForm");
const fejlBesked = document.getElementById("fejlBesked");
const feedback = document.getElementById("feedback");

// Læs patientnummer fra URL, fx ?patient=1 (samme som History)
// Uden nummer i URL bruges patient 1
const urlParams = new URLSearchParams(window.location.search);
let patientId = Number(urlParams.get("patient")) || 1;

// Laver en dato om til tekst som "2026-11-10", som datofeltet bruger
function lavDatoTekst(dato) {
    const aar = dato.getFullYear();
    const maaned = String(dato.getMonth() + 1).padStart(2, "0"); // Januar er 0 i JavaScript
    const dag = String(dato.getDate()).padStart(2, "0");
    return aar + "-" + maaned + "-" + dag;
}

// Laver klokkeslættet om til tekst som "14:30", som tidsfeltet bruger
function lavTidTekst(dato) {
    const timer = String(dato.getHours()).padStart(2, "0");
    const minutter = String(dato.getMinutes()).padStart(2, "0");
    return timer + ":" + minutter;
}

// Kalenderen må kun vise datoer fra 14 dage tilbage til i dag (samme periode som History).
// Så kan man ikke vælge andre årstal.
const datoFelt = document.getElementById("dato");
const tidFelt = document.getElementById("tid");
const idag = new Date();
const fjortenDageSiden = new Date();
fjortenDageSiden.setDate(idag.getDate() - 14);
datoFelt.max = lavDatoTekst(idag);
datoFelt.min = lavDatoTekst(fjortenDageSiden);

// Udfylder felterne med dagens dato og klokkeslættet lige nu
function udfyldNu() {
    const nu = new Date();
    datoFelt.value = lavDatoTekst(nu);
    tidFelt.value = lavTidTekst(nu);
}
udfyldNu();

// Når formularen sendes: gem symptomet med POST
form.addEventListener("submit", async function (event) {
    event.preventDefault(); // Stopper browseren i at genindlæse siden
    fejlBesked.textContent = "";
    feedback.textContent = "";

    const dato = document.getElementById("dato").value; // fx "2026-11-10"
    const tid = document.getElementById("tid").value;   // fx "14:30"
    const tekst = document.getElementById("symptomer").value.trim();

    // Sætter dato og tid sammen til ét tidspunkt
    const valgtTidspunkt = new Date(dato + "T" + tid);

    // Tjekker at dato og tid er udfyldt og gyldige
    if (!dato || !tid || isNaN(valgtTidspunkt.getTime())) {
        fejlBesked.textContent = "Please choose a valid date and time.";
        return;
    }

    // Tjekker at tidspunktet ikke ligger i fremtiden
    const nu = new Date();
    if (valgtTidspunkt > nu) {
        fejlBesked.textContent = "The date and time cannot be in the future.";
        return;
    }

    // Tjekker at tidspunktet højst er 14 dage gammelt (samme periode som History)
    const graense = new Date();
    graense.setDate(nu.getDate() - 14);
    if (valgtTidspunkt < graense) {
        fejlBesked.textContent = "You can only report symptoms from the last 14 days.";
        return;
    }

    try {
        const res = await fetch("/api/symptomer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                patient_id: patientId,
                tidspunkt: dato + " " + tid, // fx "2026-11-10 14:30"
                beskrivelse: tekst
            })
        });

        if (res.status === 401) {
            window.location.replace("/index.html");
            return;
        }

        // Serveren afviste felterne (400): vis serverens fejlbesked
        if (res.status === 400) {
            const svar = await res.json();
            fejlBesked.textContent = svar.error;
            return;
        }

        // Serveren svarede med en anden fejl (fx 500)
        if (!res.ok) {
            fejlBesked.textContent = "Could not save the symptom. Please check the fields.";
            return;
        }

        // Succes (201): vis besked og tøm formularen
        feedback.textContent = "Saved";
        form.reset();
        udfyldNu(); // Sæt dato og tid til nu igen efter at formularen er tømt
    } catch (error) {
        // Ingen forbindelse til serveren
        fejlBesked.textContent = "Something went wrong. Please try again.";
    }
});

// Knapperne i menuen
document.getElementById("ForsideKnap").onclick = function () {
    window.location.href = "../Forside/Forside.html" + (urlParams.has("patient") ? "?patient=" + patientId : "");
};
document.getElementById("Historyknap").onclick = function () {
    window.location.href = "../History/History.html" + (urlParams.has("patient") ? "?patient=" + patientId : "");
};
document.getElementById("PatientsKnap").onclick = function () {
    window.location.href = "../Patients/Patients.html";
};

form.hidden = true;
window.visLogin().then((bruger) => {
    form.hidden = !bruger;
    if (bruger && bruger.patient_id != null) {
        patientId = bruger.patient_id;
        document.getElementById("PatientsKnap").hidden = true;
    }
});

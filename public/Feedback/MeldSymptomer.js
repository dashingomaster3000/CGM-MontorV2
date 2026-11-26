// Elementer på siden
const form = document.getElementById("symptomForm");
const fejlBesked = document.getElementById("fejlBesked");
const feedback = document.getElementById("feedback");

// Patientnummer fra adressen, fx ?patient=1 (ellers patient 1)
const urlParams = new URLSearchParams(window.location.search);
const patientId = Number(urlParams.get("patient")) || 1;

// Dato som "2026-11-10" til datofeltet
function lavDatoTekst(dato) {
    const aar = dato.getFullYear();
    const maaned = String(dato.getMonth() + 1).padStart(2, "0"); // Januar er 0 i JavaScript
    const dag = String(dato.getDate()).padStart(2, "0");
    return aar + "-" + maaned + "-" + dag;
}

// Klokkeslæt som "14:30" til tidsfeltet
function lavTidTekst(dato) {
    const timer = String(dato.getHours()).padStart(2, "0");
    const minutter = String(dato.getMinutes()).padStart(2, "0");
    return timer + ":" + minutter;
}

// Kalenderen viser kun de seneste 14 dage
const datoFelt = document.getElementById("dato");
const tidFelt = document.getElementById("tid");
const idag = new Date();
const fjortenDageSiden = new Date();
fjortenDageSiden.setDate(idag.getDate() - 14);
datoFelt.max = lavDatoTekst(idag);
datoFelt.min = lavDatoTekst(fjortenDageSiden);

// Udfylder felterne med dato og klokkeslæt lige nu
function udfyldNu() {
    const nu = new Date();
    datoFelt.value = lavDatoTekst(nu);
    tidFelt.value = lavTidTekst(nu);
}
udfyldNu();

// Gemmer symptomet med POST, når formularen sendes
form.addEventListener("submit", async function (event) {
    event.preventDefault(); // Stopper browseren i at genindlæse siden
    fejlBesked.textContent = "";
    feedback.textContent = "";

    const dato = datoFelt.value; // fx "2026-11-10"
    const tid = tidFelt.value;   // fx "14:30"
    const tekst = document.getElementById("symptomer").value.trim();

    const valgtTidspunkt = new Date(dato + "T" + tid);

    // Dato og tid skal være udfyldt og gyldige
    if (!dato || !tid || isNaN(valgtTidspunkt.getTime())) {
        fejlBesked.textContent = "Please choose a valid date and time.";
        return;
    }

    // Tidspunktet må ikke ligge i fremtiden
    const nu = new Date();
    if (valgtTidspunkt > nu) {
        fejlBesked.textContent = "The date and time cannot be in the future.";
        return;
    }

    // Tidspunktet må højst være 14 dage gammelt
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

        // 401: ikke logget ind
        if (res.status === 401) {
            fejlBesked.textContent = "Please log in first.";
            return;
        }

        // 400: serverens fejlbesked vises
        if (res.status === 400) {
            const svar = await res.json();
            fejlBesked.textContent = svar.error;
            return;
        }

        // Anden fejl, fx 500
        if (!res.ok) {
            fejlBesked.textContent = "Could not save the symptom. Please check the fields.";
            return;
        }

        // 201: gemt, formularen tømmes
        feedback.textContent = "Saved";
        form.reset();
        udfyldNu(); // Dato og tid sættes til nu igen
    } catch (error) {
        // Ingen forbindelse til serveren
        fejlBesked.textContent = "Something went wrong. Please try again.";
    }
});

// Kun patienter melder symptomer, sundhedsprofessionelle sendes til patientlisten
visLogin().then(function (bruger) {
    if (bruger && bruger.role === "professional") {
        window.location.replace("/Patients/Patients.html");
    }
});

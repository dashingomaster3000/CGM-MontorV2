// Elementerne på siden
const form = document.getElementById("symptomForm");
const patientSelect = document.getElementById("patient");
const symptomTabel = document.getElementById("symptomTabel");
const fejlBesked = document.getElementById("fejlBesked");
const feedback = document.getElementById("feedback");

// Listen med patienter fra /api/patients. Bruges til at slå navne op.
let patienter = [];

// Henter patienterne og fylder <select> med id som value og navn som tekst
async function hentPatienter() {
    const res = await fetch("/api/patients");
    if (!res.ok) {
        throw new Error("Could not load patients");
    }
    patienter = await res.json();

    for (const patient of patienter) {
        const option = document.createElement("option");
        option.value = patient.id;
        option.textContent = patient.navn;
        patientSelect.appendChild(option);
    }
}

// Finder patientens navn ud fra patient_id i listen (ingen JOIN i SQL)
function findNavn(patientId) {
    const patient = patienter.find((p) => p.id === patientId);
    if (patient) {
        return patient.navn;
    }
    return "Unknown patient";
}

// Henter alle symptomer og viser dem i tabellen
async function hentSymptomer() {
    const res = await fetch("/api/symptomer");
    if (!res.ok) {
        throw new Error("Could not load symptoms");
    }
    const symptomer = await res.json();

    symptomTabel.innerHTML = "";
    for (const symptom of symptomer) {
        const raekke = document.createElement("tr");
        const celler = [
            symptom.id,
            findNavn(symptom.patient_id),
            symptom.tidspunkt.slice(0, 16),
            symptom.beskrivelse
        ];
        // textContent sørger for, at teksten aldrig bliver læst som HTML
        for (const tekst of celler) {
            const celle = document.createElement("td");
            celle.textContent = tekst;
            raekke.appendChild(celle);
        }
        symptomTabel.appendChild(raekke);
    }
}

// Når formularen sendes: gem symptomet med POST
form.addEventListener("submit", async function (event) {
    event.preventDefault(); // Stopper browseren i at genindlæse siden
    fejlBesked.textContent = "";
    feedback.textContent = "";

    const dato = document.getElementById("dato").value;
    const tid = document.getElementById("tid").value;
    const tekst = document.getElementById("symptomer").value.trim();

    try {
        const res = await fetch("/api/symptomer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                patient_id: Number(patientSelect.value),
                tidspunkt: dato + " " + tid,
                beskrivelse: tekst
            })
        });

        // Serveren svarede med en fejl (fx 400 eller 500)
        if (!res.ok) {
            fejlBesked.textContent = "Could not save the symptom. Please check the fields.";
            return;
        }

        // Succes (201): vis besked, tøm formularen og hent rækkerne igen
        feedback.textContent = "Saved";
        form.reset();
        await hentSymptomer();
    } catch (error) {
        // Ingen forbindelse til serveren
        fejlBesked.textContent = "Something went wrong. Please try again.";
    }
});

// Ved start: hent først patienterne (til navnene), så symptomerne
async function start() {
    try {
        await hentPatienter();
        await hentSymptomer();
    } catch (error) {
        fejlBesked.textContent = "Could not load data from the server.";
    }
}
start();

// Knapperne i menuen
document.getElementById("ForsideKnap").onclick = function () {
    window.location.href = "../Forside/Forside.html";
};
document.getElementById("Historyknap").onclick = function () {
    window.location.href = "../History/History.html";
};
document.getElementById("Loginknap").onclick = function () {
    sessionStorage.clear(); // Log ud: slet login-data og gå til login-siden.
    window.location.href = "../index.html";
};

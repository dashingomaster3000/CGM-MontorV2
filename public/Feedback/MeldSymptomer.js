// Elementerne på siden
const form = document.getElementById("symptomForm");
const fejlBesked = document.getElementById("fejlBesked");
const feedback = document.getElementById("feedback");

// Læs patientnummer fra URL, fx ?patient=1 (samme som History)
// Uden nummer i URL bruges patient 1
const urlParams = new URLSearchParams(window.location.search);
const patientId = Number(urlParams.get("patient")) || 1;

// Når formularen sendes: gem symptomet med POST
form.addEventListener("submit", async function (event) {
    event.preventDefault(); // Stopper browseren i at genindlæse siden
    fejlBesked.textContent = "";
    feedback.textContent = "";

    const dato = document.getElementById("dato").value;
    const tekst = document.getElementById("symptomer").value.trim();

    try {
        const res = await fetch("/api/symptomer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                patient_id: patientId,
                tidspunkt: dato,
                beskrivelse: tekst
            })
        });

        // Serveren svarede med en fejl (fx 400 eller 500)
        if (!res.ok) {
            fejlBesked.textContent = "Could not save the symptom. Please check the fields.";
            return;
        }

        // Succes (201): vis besked og tøm formularen
        feedback.textContent = "Saved";
        form.reset();
    } catch (error) {
        // Ingen forbindelse til serveren
        fejlBesked.textContent = "Something went wrong. Please try again.";
    }
});

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

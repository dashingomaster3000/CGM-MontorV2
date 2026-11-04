// Demo-borgeren er patient 1 i databasen
const patientId = 1;

// Sender symptomet til serveren og giver true, hvis det blev gemt (201)
async function gemSymptom(dato, tid, tekst) {
    const response = await fetch("/api/symptomer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            patient_id: patientId,
            tidspunkt: dato + " " + tid,
            beskrivelse: tekst
        })
    });
    return response.status === 201;
}

// Tømmer felterne efter et symptom er gemt
function toemFelter() {
    document.getElementById("dato").value = "";
    document.getElementById("tid").value = "";
    document.getElementById("symptomer").value = "";
}

document.getElementById("sendKnap").addEventListener("click", async function() {
    const tekst = document.getElementById("symptomer").value.trim();
    const dato = document.getElementById("dato").value;
    const tid = document.getElementById("tid").value;
    const fejlBesked = document.getElementById("fejlBesked");
    const feedback = document.getElementById("feedback");

    // Tjekker om dato, tid og tekst er udfyldt, og viser fejlbesked hvis ikke
    fejlBesked.textContent = "";
    feedback.textContent = "";
    if (dato === "") {
        fejlBesked.textContent = "Please choose a date.";
        return;
    }
    if (tid === "") {
        fejlBesked.textContent = "Please choose a time.";
        return;
    }
    if (tekst === "") {
        fejlBesked.textContent = "Please describe a symptom before sending.";
        return;
    }

    // Gemmer i databasen og viser besked alt efter svaret
    try {
        const gemt = await gemSymptom(dato, tid, tekst);
        if (gemt) {
            feedback.textContent = "Thank you! Your symptoms have been saved.";
            toemFelter();
        } else {
            feedback.textContent = "Something went wrong. Please try again.";
        }
    } catch (error) {
        // Ingen forbindelse til serveren
        feedback.textContent = "Something went wrong. Please try again.";
    }
});

document.getElementById("ForsideKnap").onclick = function() {
    window.location.href = "../Forside/Forside.html";
};
document.getElementById("Historyknap").onclick = function() {
    window.location.href = "../History/History.html";
};
document.getElementById("Loginknap").onclick = function() {
    sessionStorage.clear(); // Log ud: slet login-data og gå til login-siden.
    window.location.href = "../index.html";
};
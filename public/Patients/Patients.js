// Elementer på siden
const patientTable = document.getElementById("patientTable");
const message = document.getElementById("message");

// Tilføjer en celle med tekst til en række
function addCell(row, text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    row.appendChild(cell);
}

// Knap, der åbner patientens History-side
function addHistoryButton(row, id) {
    const cell = document.createElement("td");
    const button = document.createElement("button");
    button.textContent = "See history";
    button.className = "day-button";
    button.addEventListener("click", function () {
        window.location.href = "../History/History.html?patient=" + id;
    });
    cell.appendChild(button);
    row.appendChild(cell);
}

// Én række pr. patient
function showPatients(patientList) {
    patientTable.innerHTML = "";
    for (const patient of patientList) {
        const row = document.createElement("tr");
        addCell(row, patient.navn);
        // Alle CPR-numre er syntetiske testnumre
        addCell(row, patient.cpr);
        addHistoryButton(row, patient.id);
        patientTable.appendChild(row);
    }
}

// Henter og viser alle patienter
async function loadPatients() {
    try {
        const response = await fetch("/api/patients");
        // Ved 401 sendes brugeren til login-siden
        if (response.status === 401) { window.location.replace("/index.html"); return; }
        if (!response.ok) {
            throw new Error("Server error");
        }
        const patientList = await response.json();
        showPatients(patientList);
    } catch (error) {
        message.textContent = "Could not connect to the server.";
    }
}

// Tjekker login, før patienterne hentes
visLogin().then(function (bruger) {
    if (!bruger) return;
    loadPatients();
});

// Elementer på siden
const patientTable = document.getElementById("patientTable");
const message = document.getElementById("message");
const logoutLink = document.getElementById("logoutLink");

// Vis kun de første 6 cifre af CPR, fx "251248-xxxx"
function hideCpr(cpr) {
    return cpr.slice(0, 6) + "-xxxx";
}

// Tilføj en celle med tekst til en række
function addCell(row, text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    row.appendChild(cell);
}

// Lav en "See history"-knap, der går til patientens History-side
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

// Lav én række i tabellen pr. patient
function showPatients(patientList) {
    patientTable.innerHTML = "";
    for (const patient of patientList) {
        const row = document.createElement("tr");
        addCell(row, patient.navn);
        addCell(row, hideCpr(patient.cpr));
        addHistoryButton(row, patient.id);
        patientTable.appendChild(row);
    }
}

// Hent patienterne fra serveren
async function loadPatients() {
    try {
        const response = await fetch("/api/patients");
        if (!response.ok) {
            throw new Error("Server error");
        }
        const patientList = await response.json();
        showPatients(patientList);
    } catch (error) {
        message.textContent = "Could not connect to the server.";
    }
}

// Log ud: slet sessionStorage og gå til login-siden
logoutLink.addEventListener("click", function () {
    sessionStorage.clear();
});

// Start siden
loadPatients();

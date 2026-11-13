// Elementer på siden, vi skal bruge
const patientTable = document.getElementById("patientTable");
const message = document.getElementById("message");

// Vis kun de første 6 cifre af CPR
function hideCpr(cpr) {
    return cpr.slice(0, 6) + "-xxxx";
}

// Tilføj en celle med tekst til en række
function addCell(row, text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    row.appendChild(cell);
}

// Lav knap, der åbner patientens History-side
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

// Hent alle patienterne fra serveren og vis
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

// Tjek login først (Auth.js). Ikke logget ind: Auth.js sender til login-siden.
// Hent derefter patienterne. Log ud håndteres af Auth.js.
visLogin().then(function (bruger) {
    if (!bruger) return;
    loadPatients();
});

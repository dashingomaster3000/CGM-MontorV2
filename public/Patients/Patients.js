// Elementer på siden, vi skal bruge
const patientTable = document.getElementById("patientTable");
const message = document.getElementById("message");
const patientSearch = document.getElementById("patientSearch");
let patients = [];

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

// Lav knapper, der åbner patientens dashboard og History-side
function addPatientActions(row, id) {
    const cell = document.createElement("td");
    for (const [label, page] of [
        ["Dashboard", "../Forside/Forside.html"],
        ["See history", "../History/History.html"]
    ]) {
        const button = document.createElement("button");
        button.textContent = label;
        button.className = "day-button";
        button.addEventListener("click", function () {
            window.location.href = page + "?patient=" + id;
        });
        cell.appendChild(button);
    }
    row.appendChild(cell);
}

// Lav én række i tabellen pr. patient
function showPatients(patientList) {
    patientTable.innerHTML = "";
    const query = patientSearch.value.trim().toLocaleLowerCase();
    const cprQuery = query.replace(/\D/g, "");
    const matchingPatients = patientList.filter(function (patient) {
        return !query ||
            patient.navn.toLocaleLowerCase().includes(query) ||
            (cprQuery && patient.cpr.replace(/\D/g, "").includes(cprQuery));
    });

    if (matchingPatients.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 3;
        cell.textContent = "No matching patients.";
        row.appendChild(cell);
        patientTable.appendChild(row);
        return;
    }

    for (const patient of matchingPatients) {
        const row = document.createElement("tr");
        addCell(row, patient.navn);
        addCell(row, hideCpr(patient.cpr));
        addPatientActions(row, patient.id);
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
        patients = patientList;
        showPatients(patients);
    } catch (error) {
        message.textContent = "Could not connect to the server.";
    }
}

patientSearch.addEventListener("input", function () {
    showPatients(patients);
});

// Hent kun patientlisten, når serveren har bekræftet login-sessionen.
window.visLogin().then((bruger) => {
    if (!bruger) return;
    if (bruger.patient_id != null) {
        window.location.replace("/Forside/Forside.html");
        return;
    }
    loadPatients();
});

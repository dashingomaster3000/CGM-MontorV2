// Grænser for blodsukker i mmol/L
const lowLimit = 3.9;
const highLimit = 10.0;

// Læs patientnummer fra URL, fx ?patient=1
// Uden nummer i URL vises patient 1
const urlParams = new URLSearchParams(window.location.search);
const patientId = Number(urlParams.get("patient")) || 1;

// Liste over dage med deres målinger
// Fyldes ud, når serverdata er hentet
let days = [];

// Elementer på siden, vi skal bruge
const patientName = document.getElementById("patientName");
const button7 = document.getElementById("button7");
const button14 = document.getElementById("button14");
const average = document.getElementById("average");
const timeInRange = document.getElementById("timeInRange");
const lowCount = document.getElementById("lowCount");
const tableBody = document.getElementById("tableBody");
const symptomList = document.getElementById("symptomList");

// Beregn gennemsnittet af en liste tal
function getAverage(values) {
    let sum = 0;
    for (const value of values) {
        sum = sum + value;
    }
    return sum / values.length;
}

// Tilføj én celle med tekst til række
function addCell(row, text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    row.appendChild(cell);
}

// Vis en besked i tabellen, fx ingen målinger
function showTableMessage(message) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = message;
    row.appendChild(cell);
    tableBody.appendChild(row);
}

// Udfyld nøgletal og tabel for valgte dage
function showHistory(dayCount) {
    // Ryd de gamle rækker i tabellen
    tableBody.innerHTML = "";

    // Tag de sidste dage med målinger
    const chosenDays = days.slice(-dayCount);

    // Ingen data: vis streger og en besked
    if (chosenDays.length === 0) {
        average.textContent = "–";
        timeInRange.textContent = "–";
        lowCount.textContent = "–";
        showTableMessage("No measurements yet");
        return;
    }

    // Alle målinger fra de valgte dage
    let allValues = [];

    // Lav én tabelrække for hver dag
    for (const day of chosenDays) {
        const lowest = Math.min(...day.values);
        const highest = Math.max(...day.values);

        const row = document.createElement("tr");
        // Dage med lav måling får rød række
        if (lowest < lowLimit) {
            row.classList.add("low");
        }
        addCell(row, day.date);
        addCell(row, getAverage(day.values).toFixed(1) + " mmol/L");
        addCell(row, lowest.toFixed(1) + " mmol/L");
        addCell(row, highest.toFixed(1) + " mmol/L");
        tableBody.appendChild(row);

        allValues = allValues.concat(day.values);
    }

    // Tæl målinger i mål og lave målinger
    let inRange = 0;
    let low = 0;
    for (const value of allValues) {
        if (value >= lowLimit && value <= highLimit) {
            inRange = inRange + 1;
        }
        if (value < lowLimit) {
            low = low + 1;
        }
    }

    // Vis de beregnede nøgletal på siden
    average.textContent = getAverage(allValues).toFixed(1) + " mmol/L";
    timeInRange.textContent = Math.round(inRange / allValues.length * 100) + " %";
    lowCount.textContent = low;
}

// Hent symptomer gemt i localStorage under "symptoms"
function getSavedSymptoms() {
    try {
        const saved = JSON.parse(localStorage.getItem("symptoms"));
        // Brug det kun, hvis det er en liste
        if (Array.isArray(saved)) {
            return saved;
        }
    } catch (error) {
        // Forkerte data i localStorage bliver ignoreret
    }
    return [];
}

// Udfyld listen med symptomer på siden
function showSymptoms() {
    symptomList.innerHTML = "";

    // Hent de gemte symptomer fra localStorage
    const symptoms = getSavedSymptoms();

    // Ingen symptomer: vis en besked i stedet
    if (symptoms.length === 0) {
        const item = document.createElement("li");
        item.textContent = "No symptoms reported yet";
        symptomList.appendChild(item);
        return;
    }

    // Lav ét listepunkt for hvert symptom
    for (const symptom of symptoms) {
        const item = document.createElement("li");
        item.textContent = symptom.date + ": " + symptom.text;
        symptomList.appendChild(item);
    }
}

// Marker den valgte knap og vis data
function selectDays(dayCount) {
    button7.classList.toggle("selected", dayCount === 7);
    button14.classList.toggle("selected", dayCount === 14);
    showHistory(dayCount);
}

// Knapperne til at vælge 7 eller 14 dage
button7.addEventListener("click", function () {
    selectDays(7);
});
button14.addEventListener("click", function () {
    selectDays(14);
});

// Hent JSON fra serveren, fejl ved fejlsvar
async function getJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Server error");
    }
    return response.json();
}

// Saml målingerne pr. dato i dage
// Målingerne er sorteret, så dagene bliver også
function groupByDate(maalinger) {
    const result = [];
    for (const maaling of maalinger) {
        // Tag kun datoen, fx "2026-10-21"
        const date = maaling.tidspunkt.slice(0, 10);
        const value = Number(maaling.glukose_mmol);

        // Ny dato giver ny dag, ellers tilføj
        const lastDay = result[result.length - 1];
        if (lastDay && lastDay.date === date) {
            lastDay.values.push(value);
        } else {
            result.push({ date: date, values: [value] });
        }
    }
    return result;
}

// Vis patientens navn eller en fejlbesked
function showPatientName(patientList) {
    const patient = patientList.find(function (p) {
        return p.id === patientId;
    });
    if (patient) {
        patientName.textContent = "Patient: " + patient.navn;
    } else {
        patientName.textContent = "Patient not found";
    }
}

// Hent patient og målinger, vis 7 dage
async function loadData() {
    try {
        const patientList = await getJson("/api/patients");
        const maalinger = await getJson("/api/patients/" + patientId + "/maalinger");
        showPatientName(patientList);
        days = groupByDate(maalinger);
        selectDays(7);
    } catch (error) {
        // Ingen forbindelse: vis besked og tom tabel
        patientName.textContent = "Could not connect to the server.";
        selectDays(7);
    }
}

// Start siden ved at hente alt data
loadData();
showSymptoms();

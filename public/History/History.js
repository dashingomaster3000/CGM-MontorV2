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

// Bliver true, hvis målingerne ikke kunne hentes fra serveren
let loadFailed = false;

// Elementer på siden, vi skal bruge
const patientName = document.getElementById("patientName");
const button7 = document.getElementById("button7");
const button14 = document.getElementById("button14");
const average = document.getElementById("average");
const timeInRange = document.getElementById("timeInRange");
const lowCount = document.getElementById("lowCount");
const tableBody = document.getElementById("tableBody");
const measurementBody = document.getElementById("measurementBody");
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
    // Ryd de gamle rækker i begge tabeller
    tableBody.innerHTML = "";
    measurementBody.innerHTML = "";

    // Tag de sidste dage med målinger
    const chosenDays = days.slice(-dayCount);

    // Ingen data: vis streger og en besked
    if (chosenDays.length === 0) {
        average.textContent = "–";
        timeInRange.textContent = "–";
        lowCount.textContent = "–";
        // Skelner mellem en fejl og en patient uden målinger
        if (loadFailed) {
            showTableMessage("Could not load measurements. Please try again later.");
        } else {
            showTableMessage("No measurements yet");
        }
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

        // Lav én række for hver måling på dagen med dato, klokkeslæt og værdi
        for (let i = 0; i < day.values.length; i++) {
            const measurementRow = document.createElement("tr");
            // Lave målinger får rød række
            if (day.values[i] < lowLimit) {
                measurementRow.classList.add("low");
            }
            addCell(measurementRow, day.date);
            addCell(measurementRow, day.times[i]);
            addCell(measurementRow, day.values[i].toFixed(1) + " mmol/L");
            measurementBody.appendChild(measurementRow);
        }

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
    // Viser procenten sammen med grænserne, fx "73 % (3.9–10.0 mmol/L)"
    timeInRange.textContent = Math.round(inRange / allValues.length * 100) + " % (" +
        lowLimit.toFixed(1) + "–" + highLimit.toFixed(1) + " mmol/L)";
    lowCount.textContent = low;
}

// Tilføj ét punkt med tekst til symptomlisten
function addSymptomItem(text) {
    const item = document.createElement("li");
    item.textContent = text;
    symptomList.appendChild(item);
}

// Udfyld listen med symptomer fra databasen
function showSymptoms(symptoms) {
    symptomList.innerHTML = "";

    // Ingen symptomer: vis en besked i stedet
    if (symptoms.length === 0) {
        addSymptomItem("No symptoms reported yet");
        return;
    }

    // Lav ét listepunkt for hvert symptom, fx "2026-11-04 08:30: Dizzy"
    // tidspunkt ser sådan ud: "2026-11-04 08:30:00", så vi tager de første 16 tegn
    for (const symptom of symptoms) {
        addSymptomItem(symptom.tidspunkt.slice(0, 16) + ": " + symptom.beskrivelse);
    }
}

// Hent patientens symptomer fra serveren og vis dem
async function loadSymptoms() {
    try {
        const symptoms = await getJson("/api/patients/" + patientId + "/symptomer");
        showSymptoms(symptoms);
    } catch (error) {
        symptomList.innerHTML = "";
        addSymptomItem("Could not load symptoms.");
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
        // Tag klokkeslættet, fx "06:00" fra "2026-10-21 06:00:00"
        const time = maaling.tidspunkt.slice(11, 16);
        const value = Number(maaling.glukose_mmol);

        // Ny dato giver ny dag, ellers tilføj
        const lastDay = result[result.length - 1];
        if (lastDay && lastDay.date === date) {
            lastDay.values.push(value);
            lastDay.times.push(time);
        } else {
            result.push({ date: date, values: [value], times: [time] });
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
        // Fejl fra serveren eller databasen: vis besked og fejl i tabellen
        loadFailed = true;
        patientName.textContent = "Could not connect to the server.";
        selectDays(7);
    }
}

// Start siden ved at hente alt data
loadData();
loadSymptoms();

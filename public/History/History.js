// Limits for blood sugar in mmol/L
const lowLimit = 3.9;
const highLimit = 10.0;

// Read the patient number from the URL, e.g. History.html?patient=1
// If there is no number in the URL, patient 1 is shown
const urlParams = new URLSearchParams(window.location.search);
const patientId = Number(urlParams.get("patient")) || 1;

// Dagene med målinger, fx [{ date: "2026-10-21", values: [6.2, 7.8] }]
// Fyldes ud, når data er hentet fra serveren
let days = [];

// Elements on the page
const patientName = document.getElementById("patientName");
const button7 = document.getElementById("button7");
const button14 = document.getElementById("button14");
const average = document.getElementById("average");
const timeInRange = document.getElementById("timeInRange");
const lowCount = document.getElementById("lowCount");
const tableBody = document.getElementById("tableBody");
const symptomList = document.getElementById("symptomList");

// Calculate the average of a list of numbers
function getAverage(values) {
    let sum = 0;
    for (const value of values) {
        sum = sum + value;
    }
    return sum / values.length;
}

// Add one cell with text to a table row
function addCell(row, text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    row.appendChild(cell);
}

// Show a message in the table, e.g. "No measurements yet"
function showTableMessage(message) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = message;
    row.appendChild(cell);
    tableBody.appendChild(row);
}

// Fill key figures and table for the last 7 or 14 days
function showHistory(dayCount) {
    // Clear the old rows
    tableBody.innerHTML = "";

    // Get the last days that have measurements
    const chosenDays = days.slice(-dayCount);

    // No data: show dashes and a message
    if (chosenDays.length === 0) {
        average.textContent = "–";
        timeInRange.textContent = "–";
        lowCount.textContent = "–";
        showTableMessage("No measurements yet");
        return;
    }

    // All measurements from the chosen days
    let allValues = [];

    // One table row per day
    for (const day of chosenDays) {
        const lowest = Math.min(...day.values);
        const highest = Math.max(...day.values);

        const row = document.createElement("tr");
        // Days with a low measurement get a red row
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

    // Count measurements in range and low measurements
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

    // Show the key figures
    average.textContent = getAverage(allValues).toFixed(1) + " mmol/L";
    timeInRange.textContent = Math.round(inRange / allValues.length * 100) + " %";
    lowCount.textContent = low;
}

// Get symptoms saved in localStorage under the key "symptoms"
function getSavedSymptoms() {
    try {
        const saved = JSON.parse(localStorage.getItem("symptoms"));
        // Only use it if it is a list
        if (Array.isArray(saved)) {
            return saved;
        }
    } catch (error) {
        // Bad data in localStorage is ignored
    }
    return [];
}

// Fill the symptom list
function showSymptoms() {
    symptomList.innerHTML = "";

    // Symptoms from localStorage
    const symptoms = getSavedSymptoms();

    // No symptoms: show a message
    if (symptoms.length === 0) {
        const item = document.createElement("li");
        item.textContent = "No symptoms reported yet";
        symptomList.appendChild(item);
        return;
    }

    for (const symptom of symptoms) {
        const item = document.createElement("li");
        item.textContent = symptom.date + ": " + symptom.text;
        symptomList.appendChild(item);
    }
}

// Mark the chosen button and show the data
function selectDays(dayCount) {
    button7.classList.toggle("selected", dayCount === 7);
    button14.classList.toggle("selected", dayCount === 14);
    showHistory(dayCount);
}

// Buttons for 7 and 14 days
button7.addEventListener("click", function () {
    selectDays(7);
});
button14.addEventListener("click", function () {
    selectDays(14);
});

// Hent JSON fra serveren. Giver en fejl, hvis serveren svarer med en fejl
async function getJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Server error");
    }
    return response.json();
}

// Saml målingerne pr. dato, fx [{ date: "2026-10-21", values: [6.2, 7.8] }]
// Målingerne kommer sorteret efter tidspunkt, så dagene bliver også sorteret
function groupByDate(maalinger) {
    const result = [];
    for (const maaling of maalinger) {
        // "2026-10-21 06:00:00" -> "2026-10-21"
        const date = maaling.tidspunkt.slice(0, 10);
        const value = Number(maaling.glukose_mmol);

        // Ny dato: lav en ny dag. Ellers læg værdien i den sidste dag
        const lastDay = result[result.length - 1];
        if (lastDay && lastDay.date === date) {
            lastDay.values.push(value);
        } else {
            result.push({ date: date, values: [value] });
        }
    }
    return result;
}

// Show the patient's name, or a message if the patient does not exist
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

// Hent patient og målinger fra serveren og vis 7 dage
async function loadData() {
    try {
        const patientList = await getJson("/api/patients");
        const maalinger = await getJson("/api/patients/" + patientId + "/maalinger");
        showPatientName(patientList);
        days = groupByDate(maalinger);
        selectDays(7);
    } catch (error) {
        patientName.textContent = "Could not connect to the server.";
        selectDays(7);
    }
}

// Start the page
loadData();
showSymptoms();

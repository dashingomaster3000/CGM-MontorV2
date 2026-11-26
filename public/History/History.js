// GLUKOSE_LAV og GLUKOSE_HOEJ kommer fra Assets/Glukose.js

// Patientnummer fra adressen, fx ?patient=1 (ellers patient 1)
const urlParams = new URLSearchParams(window.location.search);
const patientId = Number(urlParams.get("patient")) || 1;

// Dage med deres målinger, fyldes når data er hentet
let days = [];

// Bliver true, hvis målingerne ikke kunne hentes
let loadFailed = false;

// Elementer på siden
const patientName = document.getElementById("patientName");
const button7 = document.getElementById("button7");
const button14 = document.getElementById("button14");
const average = document.getElementById("average");
const timeInRange = document.getElementById("timeInRange");
const lowCount = document.getElementById("lowCount");
const tableBody = document.getElementById("tableBody");
const measurementBody = document.getElementById("measurementBody");
const symptomList = document.getElementById("symptomList");
const eventList = document.getElementById("eventList");

// Gennemsnit af en liste tal
function getAverage(values) {
    let sum = 0;
    for (const value of values) {
        sum = sum + value;
    }
    return sum / values.length;
}

// Laveste værdi i en liste tal
function getLowest(values) {
    let lowest = values[0];
    for (const value of values) {
        if (value < lowest) lowest = value;
    }
    return lowest;
}

// Højeste værdi i en liste tal
function getHighest(values) {
    let highest = values[0];
    for (const value of values) {
        if (value > highest) highest = value;
    }
    return highest;
}

// Tilføjer en celle med tekst til en række
function addCell(row, text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    row.appendChild(cell);
}

// Viser en besked i tabellen, fx ingen målinger
function showTableMessage(message) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = message;
    row.appendChild(cell);
    tableBody.appendChild(row);
}

// Udfylder nøgletal og tabeller for 7 eller 14 dage
function showHistory(dayCount) {
    tableBody.innerHTML = "";
    measurementBody.innerHTML = "";

    const chosenDays = daysInPeriod(dayCount);
    eventList.innerHTML = "";

    // Ingen data: streger og en besked
    if (chosenDays.length === 0) {
        average.textContent = "–";
        timeInRange.textContent = "–";
        lowCount.textContent = "–";
        // Skelner mellem fejl og patient uden målinger
        if (loadFailed) {
            showTableMessage("Could not load measurements. Please try again later.");
        } else {
            showTableMessage("No measurements yet");
        }
        return;
    }

    let allValues = [];

    // Én række pr. dag
    for (const day of chosenDays) {
        const lowest = getLowest(day.values);
        const highest = getHighest(day.values);

        const row = document.createElement("tr");
        // Dage med en lav måling får rød baggrund
        if (lowest < GLUKOSE_LAV) {
            row.classList.add("low");
        }
        addCell(row, formatDato(day.date));
        addCell(row, getAverage(day.values).toFixed(1) + " mmol/L");
        addCell(row, lowest.toFixed(1) + " mmol/L");
        addCell(row, highest.toFixed(1) + " mmol/L");
        tableBody.appendChild(row);

        // Én række pr. måling med dato, klokkeslæt og værdi
        for (let i = 0; i < day.values.length; i++) {
            const measurementRow = document.createElement("tr");
            if (day.values[i] < GLUKOSE_LAV) {
                measurementRow.classList.add("low");
            }
            addCell(measurementRow, formatDato(day.date));
            addCell(measurementRow, day.times[i]);
            addCell(measurementRow, day.values[i].toFixed(1) + " mmol/L");
            measurementBody.appendChild(measurementRow);
        }

        allValues = allValues.concat(day.values);
    }

    // Tæller målinger i målområdet (3,9-10,0) og lave målinger
    let inRange = 0;
    let low = 0;
    for (const value of allValues) {
        if (value >= GLUKOSE_LAV && value <= GLUKOSE_HOEJ) {
            inRange = inRange + 1;
        }
        if (value < GLUKOSE_LAV) {
            low = low + 1;
        }
    }

    average.textContent = getAverage(allValues).toFixed(1) + " mmol/L";
    // Fx "73 % (3.9–10.0 mmol/L)"
    timeInRange.textContent = Math.round(inRange / allValues.length * 100) + " % (" +
        GLUKOSE_LAV.toFixed(1) + "–" + GLUKOSE_HOEJ.toFixed(1) + " mmol/L)";
    lowCount.textContent = low;

    showEvents(chosenDays);
}

// Kalenderdage i perioden: nyeste dag og dayCount - 1 dage tilbage
function daysInPeriod(dayCount) {
    if (days.length === 0) return [];
    const newest = new Date(days[days.length - 1].date + "T00:00:00Z");
    newest.setUTCDate(newest.getUTCDate() - (dayCount - 1));
    const firstDate = newest.toISOString().slice(0, 10);
    return days.filter(function (day) {
        return day.date >= firstDate;
    });
}

// Viser lave og høje hændelser (findHaendelser fra Glukose.js)
function showEvents(chosenDays) {
    const measurements = [];
    for (const day of chosenDays) {
        for (let i = 0; i < day.values.length; i++) {
            measurements.push({ tid: day.date + " " + day.times[i], vaerdi: day.values[i] });
        }
    }
    const events = findHaendelser(measurements);
    if (events.length === 0) {
        const row = document.createElement("tr");
        addCell(row, "No low or high glucose events in this period");
        row.firstChild.colSpan = 4;
        eventList.appendChild(row);
        return;
    }
    // Nyeste først (baglæns løkke)
    for (let i = events.length - 1; i >= 0; i--) {
        const event = events[i];
        const row = document.createElement("tr");
        row.classList.add(event.type);
        addCell(row, formatDato(event.start));
        addCell(row, formatTidsrum(event.start, event.slut));
        if (event.type === "low") {
            addCell(row, "Low");
        } else {
            addCell(row, "High");
        }
        addCell(row, event.vaerdi.toFixed(1) + " mmol/L");
        eventList.appendChild(row);
    }
}

// Tilføjer et punkt til symptomlisten
function addSymptomItem(text) {
    const item = document.createElement("li");
    item.textContent = text;
    symptomList.appendChild(item);
}

// Viser symptomerne, fx "04.11.2026 08:30: Dizzy"
function showSymptoms(symptoms) {
    symptomList.innerHTML = "";

    if (symptoms.length === 0) {
        addSymptomItem("No symptoms reported yet");
        return;
    }

    for (const symptom of symptoms) {
        addSymptomItem(formatDatoTid(symptom.tidspunkt) + ": " + symptom.beskrivelse);
    }
}

// Henter patientens symptomer
async function loadSymptoms() {
    try {
        const symptoms = await getJson("/api/patients/" + patientId + "/symptomer");
        showSymptoms(symptoms);
    } catch (error) {
        symptomList.innerHTML = "";
        addSymptomItem("Could not load symptoms.");
    }
}

// Markerer den valgte knap og viser data
function selectDays(dayCount) {
    button7.classList.toggle("selected", dayCount === 7);
    button14.classList.toggle("selected", dayCount === 14);
    showHistory(dayCount);
}

button7.addEventListener("click", function () {
    selectDays(7);
});
button14.addEventListener("click", function () {
    selectDays(14);
});

// Henter JSON fra serveren, kaster fejl ved fejlsvar
async function getJson(url) {
    const response = await fetch(url);
    // Ved 401 sendes brugeren til login-siden
    if (response.status === 401) { window.location.replace("/index.html"); return []; }
    if (!response.ok) {
        throw new Error("Server error");
    }
    return response.json();
}

// Samler målingerne pr. dato (de er allerede sorteret)
function groupByDate(maalinger) {
    const result = [];
    for (const maaling of maalinger) {
        // Datoen, fx "2026-10-21"
        const date = maaling.tidspunkt.slice(0, 10);
        // Klokkeslættet, fx "06:00"
        const time = maaling.tidspunkt.slice(11, 16);
        const value = Number(maaling.glukose_mmol);

        // Ny dato giver en ny dag
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

// Viser patientens navn
function showPatientName(patientList) {
    patientName.textContent = "Patient not found";
    for (const patient of patientList) {
        if (patient.id === patientId) {
            patientName.textContent = "Patient: " + patient.navn;
        }
    }
}

// Henter målinger (og navn) og viser 14 dage
async function loadData(bruger) {
    try {
        const maalinger = await getJson("/api/patients/" + patientId + "/maalinger");
        // Kun sundhedsprofessionelle må hente patientlisten
        if (bruger.role === "professional") {
            try {
                showPatientName(await getJson("/api/patients"));
            } catch (error) {
                patientName.textContent = "";
            }
        }
        days = groupByDate(maalinger);
        selectDays(14);
    } catch (error) {
        // Server- eller databasefejl
        loadFailed = true;
        patientName.textContent = "Could not connect to the server.";
        selectDays(14);
    }
}

// Tjekker login og tilpasser menuen, før data hentes
visLogin().then(function (bruger) {
    if (!bruger) return;
    tilpasMenu(bruger);
    loadData(bruger);
    loadSymptoms();
});

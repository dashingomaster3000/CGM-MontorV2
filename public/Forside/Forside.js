// Find statusbeskeden og det skjulte filfelt, så scriptet kan bruge dem.
const dataStatus = document.getElementById("dataStatus");
const dataFile = document.getElementById("dataFile");

// Log brugeren ud ved at rydde sessionsdata og åbne login-siden.
document.getElementById("Loginknap").onclick = function() {
    sessionStorage.clear();
    window.location.href = "../index.html";
};
// Åbn historiksiden, når brugeren vælger knappen.
document.getElementById("Historyknap").onclick = function() {
    window.location.href = "../History/History.html";
};
// Åbn siden til symptomrapportering, når brugeren vælger knappen.
document.getElementById("MeldSymptomerKnap").onclick = function() {
    window.location.href = "../Feedback/MeldSymptomer.html";
};

// Åbn den skjulte filvælger, når brugeren klikker på importknappen.
document.getElementById("importButton").addEventListener("click", function() {
    dataFile.click();
});

// Læs den valgte JSON-fil, og opdatér dashboardet med dens målinger.
dataFile.addEventListener("change", async function() {
    // Stop, hvis filvælgeren blev lukket uden at vælge en fil.
    const file = dataFile.files[0];
    if (!file) return;

    try {
        // Læs filen, omdan JSON-teksten til data, og kontrollér indholdet.
        const content = await file.text();
        const data = JSON.parse(content);
        renderDashboard(parseReadings(data));
        // Bekræft, at filen blev indlæst.
        setStatus(`Imported ${file.name}`);
    } catch (error) {
        // Vis en forklaring, hvis JSON eller glukosemålingerne er ugyldige.
        setStatus(error instanceof SyntaxError
            ? "Could not read the file. Choose a valid JSON file with a readings array."
            : error.message, true);
    }
    // Nulstil filvælgeren, så samme fil kan vælges igen.
    dataFile.value = "";
});

// Kontrollér dataenes format, og omdan hver post til en gyldig måling.
function parseReadings(data) {
    // Kræv mindst én måling i listen med navnet "readings".
    if (!data || !Array.isArray(data.readings) || data.readings.length === 0) {
        throw new Error('The file must contain a non-empty "readings" array.');
    }

    // Omdan tidspunkter og glukoseværdier, og afvis ugyldige poster.
    const readings = data.readings.map((reading, index) => {
        const timestamp = new Date(reading.timestamp);
        const glucose = Number(reading.glucose);
        if (!Number.isFinite(timestamp.getTime()) || !Number.isFinite(glucose) || glucose <= 0 || glucose > 40) {
            throw new Error(`Reading ${index + 1} needs a valid timestamp and glucose value between 0 and 40.`);
        }
        return { timestamp, glucose };
    });
    // Sortér efter tidspunkt, så nyeste værdi og grafens rækkefølge er korrekte.
    return readings.sort((a, b) => a.timestamp - b.timestamp);
}

// Beregn dashboardets tal, og send målingerne til hver visning.
function renderDashboard(readings) {
    // Den sidste måling i den sorterede liste er den nyeste.
    const latest = readings[readings.length - 1];
    // Sammenlign med den forrige måling for at finde tendensen.
    const previous = readings.length > 1 ? readings[readings.length - 2] : null;
    const difference = previous ? latest.glucose - previous.glucose : 0;
    const trend = !previous || Math.abs(difference) < 0.2
        ? "Stable"
        : difference > 0 ? "Rising" : "Falling";
    // Find dagens målinger til grafen og den daglige optælling.
    const today = latest.timestamp.toDateString();
    const todayReadings = readings.filter(reading => reading.timestamp.toDateString() === today);
    // Tæl lave målinger og dem i målområdet 3,9–10 mmol/L.
    const lowReadings = readings.filter(reading => reading.glucose < 3.9);
    const inRange = readings.filter(reading => reading.glucose >= 3.9 && reading.glucose <= 10).length;

    // Opdatér den viste værdi, tendens og måletidspunkt.
    document.getElementById("currentGlucose").textContent = `${latest.glucose.toFixed(1)} mmol/L`;
    document.getElementById("currentTrend").textContent = trend;
    document.getElementById("readingTime").textContent = `Last reading: ${formatDateTime(latest.timestamp)}`;
    // Beregn og vis gennemsnittet og andelen i målområdet.
    document.getElementById("averageGlucose").textContent =
        `${(readings.reduce((sum, reading) => sum + reading.glucose, 0) / readings.length).toFixed(1)} mmol/L`;
    document.getElementById("timeInRange").textContent = `${Math.round(inRange / readings.length * 100)}%`;
    // Vis dagens antal målinger, og fortæl om der blev fundet lave værdier.
    document.getElementById("readingCount").textContent = todayReadings.length;
    document.getElementById("patternSummary").textContent = lowReadings.length
        ? `${lowReadings.length} low reading${lowReadings.length === 1 ? "" : "s"} below 3.9 mmol/L found.`
        : "No readings below 3.9 mmol/L found.";

    // Opdatér grafen, listen over lave hændelser og det hyppigste tidspunkt.
    renderChart(todayReadings);
    renderLowEvents(readings);
    renderFrequentLowPeriod(lowReadings);
}

// Tegn en glukosegraf med SVG-elementer ud fra dagens målinger.
function renderChart(readings) {
    // Fjern den gamle graf, før de nye data tegnes.
    const svg = document.getElementById("glucoseChart");
    svg.replaceChildren();
    // Afslut, hvis datasættet ikke indeholder målinger for i dag.
    if (readings.length === 0) return;

    // Angiv grafens størrelse og pladsen til etiketter.
    const width = 760;
    const height = 250;
    const left = 48;
    const right = 16;
    const top = 18;
    const bottom = 32;
    const minValue = 0;
    // Udvid skalaen, hvis en måling ligger over grafens normale område.
    const maxValue = Math.max(14, Math.ceil(Math.max(...readings.map(reading => reading.glucose)) / 2) * 2);
    // Fordel målingerne jævnt på grafen; centrér en enkelt måling.
    const x = index => readings.length === 1
        ? (left + width - right) / 2
        : left + index / (readings.length - 1) * (width - left - right);
    // Omdan glukoseværdier til lodrette placeringer på grafen.
    const y = value => top + (maxValue - value) / (maxValue - minValue) * (height - top - bottom);

    // Tegn det farvede målområde bag grafens data.
    svg.append(svgElement("rect", {
        x: left, y: y(10), width: width - left - right, height: y(3.9) - y(10), class: "range-band"
    }));

    // Tilføj vandrette hjælpelinjer og glukoseværdier.
    [4, 7, 10, 13].forEach(value => {
        svg.append(svgElement("line", {
            x1: left, y1: y(value), x2: width - right, y2: y(value), class: "chart-grid"
        }));
        const label = svgElement("text", { x: 4, y: y(value) + 4, class: "chart-label" });
        label.textContent = value;
        svg.append(label);
    });

    // Forbind målingerne med en linje, og tilføj et punkt med en beskrivelse.
    const path = readings.map((reading, index) =>
        `${index === 0 ? "M" : "L"} ${x(index)} ${y(reading.glucose)}`
    ).join(" ");
    svg.append(svgElement("path", { d: path, class: "chart-line" }));
    readings.forEach((reading, index) => {
        const point = svgElement("circle", {
            cx: x(index), cy: y(reading.glucose), r: 4, class: "chart-point"
        });
        const title = svgElement("title");
        title.textContent = `${formatDateTime(reading.timestamp)}: ${reading.glucose.toFixed(1)} mmol/L`;
        point.append(title);
        svg.append(point);
    });

    // Skriv tidspunkterne for den første og sidste måling på grafen.
    const firstLabel = svgElement("text", { x: left, y: height - 6, class: "chart-label" });
    firstLabel.textContent = readings[0].timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const lastLabel = svgElement("text", {
        x: width - right, y: height - 6, "text-anchor": "end", class: "chart-label"
    });
    lastLabel.textContent = readings[readings.length - 1].timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    svg.append(firstLabel, lastLabel);
}

// Saml nærliggende lave målinger i hændelser, og vis de nyeste.
function renderLowEvents(readings) {
    // Fjern kort fra det forrige datasæt, før de nye oprettes.
    const container = document.getElementById("lowEvents");
    container.replaceChildren();
    const events = [];
    // Målinger under 3,9 er lave; målinger inden for 30 minutter samles.
    readings.forEach(reading => {
        if (reading.glucose >= 3.9) return;
        const current = events[events.length - 1];
        if (current && reading.timestamp - current.end <= 30 * 60 * 1000) {
            current.end = reading.timestamp;
            current.lowest = Math.min(current.lowest, reading.glucose);
        } else {
            events.push({ start: reading.timestamp, end: reading.timestamp, lowest: reading.glucose });
        }
    });

    // Vis en besked, hvis der ikke er lave målinger.
    if (events.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "No low glucose events in this data.";
        container.append(empty);
        return;
    }
    // Vis højst seks hændelser med den nyeste først.
    events.slice(-6).reverse().forEach(event => {
        const card = document.createElement("div");
        card.className = "event-card";
        const date = document.createElement("strong");
        date.textContent = event.start.toLocaleDateString();
        const time = document.createElement("span");
        time.textContent = event.start.getTime() === event.end.getTime()
            ? formatTime(event.start)
            : `${formatTime(event.start)} – ${formatTime(event.end)}`;
        const low = document.createElement("span");
        low.textContent = `Lowest: ${event.lowest.toFixed(1)} mmol/L`;
        card.append(date, time, low);
        container.append(card);
    });
}

// Find den time på dagen, hvor der er flest lave målinger.
function renderFrequentLowPeriod(lowReadings) {
    const periods = new Map();
    // Tæl lave målinger for hver time.
    lowReadings.forEach(reading => {
        const hour = reading.timestamp.getHours();
        periods.set(hour, (periods.get(hour) || 0) + 1);
    });
    // Vælg den hyppigste time, og vis den som en periode på en time.
    const frequent = [...periods.entries()].sort((a, b) => b[1] - a[1])[0];
    document.getElementById("frequentLowPeriod").textContent = frequent
        ? `${String(frequent[0]).padStart(2, "0")}:00 – ${String((frequent[0] + 1) % 24).padStart(2, "0")}:00`
        : "No low period";
}

// Opret et SVG-element, og sæt dets egenskaber til grafen.
function svgElement(name, attributes = {}) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    return element;
}

// Vis et tidspunkt i lokalt format til grafer og hændelser.
function formatTime(date) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Sæt lokal dato og tid sammen til detaljer om målingen.
function formatDateTime(date) {
    return `${date.toLocaleDateString()} ${formatTime(date)}`;
}

// Opdatér statusbeskeden, og markér den eventuelt som en fejl.
function setStatus(message, isError = false) {
    dataStatus.textContent = message;
    dataStatus.classList.toggle("error", isError);
}

// Indlæs eksempeldata automatisk, når dashboardet åbnes.
fetch("sample-glucose.json")
    .then(response => {
        // Vis en fejl, hvis serveren ikke kunne levere eksempeldataene.
        if (!response.ok) throw new Error(`Could not load sample data (${response.status}).`);
        return response.json();
    })
    .then(data => {
        // Kontrollér og vis eksempeldataene, og fortæl, hvor de kommer fra.
        renderDashboard(parseReadings(data));
        setStatus("Showing example data. Import a JSON file to view your own readings.");
    })
    // Vis fejl ved netværk, filer eller kontrol af data i statusfeltet.
    .catch(error => setStatus(error.message, true));
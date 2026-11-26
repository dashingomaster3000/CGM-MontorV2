// Find statusbeskeden og det skjulte filfelt, så scriptet kan bruge dem.
const dataStatus = document.getElementById("dataStatus");
const dataFile = document.getElementById("dataFile");

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
// M-II: ALT på dashboardet (graf, tal, hændelser, mønster og tidsrum) beregnes nu ud fra
// den samme dag, som grafen viser. Før kom tallene fra databasen og grafen fra JSON-filen,
// så tallene under grafen passede ikke til punkterne i grafen.
function renderDashboard(allReadings) {
    // M-II: Brug kun den sidste dag i datasættet, altså præcis de målinger grafen viser.
    const lastDay = allReadings[allReadings.length - 1].timestamp.toDateString();
    const readings = allReadings.filter(reading => reading.timestamp.toDateString() === lastDay);
    // Den sidste måling i den sorterede liste er den nyeste.
    const latest = readings[readings.length - 1];
    // Sammenlign med den forrige måling for at finde tendensen.
    const previous = readings.length > 1 ? readings[readings.length - 2] : null;
    const difference = previous ? latest.glucose - previous.glucose : 0;
    const trend = !previous || Math.abs(difference) < 0.2
        ? "Stable"
        : difference > 0 ? "Rising" : "Falling";
    // M-II: Tæl lave målinger og dem i målområdet med de fælles grænser fra Assets/Glukose.js.
    const lowReadings = readings.filter(reading => reading.glucose < GLUKOSE_LAV);
    const inRange = readings.filter(reading => reading.glucose >= GLUKOSE_LAV && reading.glucose <= GLUKOSE_HOEJ).length;

    // Opdatér den viste værdi, tendens og måletidspunkt.
    document.getElementById("currentGlucose").textContent = `${latest.glucose.toFixed(1)} mmol/L`;
    document.getElementById("currentTrend").textContent = trend;
    document.getElementById("readingTime").textContent = `Last reading: ${formatDateTime(latest.timestamp)}`;
    // Beregn og vis gennemsnittet og andelen i målområdet.
    document.getElementById("averageGlucose").textContent =
        `${(readings.reduce((sum, reading) => sum + reading.glucose, 0) / readings.length).toFixed(1)} mmol/L`;
    document.getElementById("timeInRange").textContent = `${Math.round(inRange / readings.length * 100)}%`;
    // Vis dagens antal målinger, og fortæl om der blev fundet lave værdier.
    document.getElementById("readingCount").textContent = readings.length;
    // M-II: Vis både antal høje og lave målinger under "Readings".
    document.getElementById("highCount").textContent = readings.filter(reading => reading.glucose > GLUKOSE_HOEJ).length;
    document.getElementById("lowCount").textContent = lowReadings.length;
    document.getElementById("patternSummary").textContent = lowReadings.length
        ? `${lowReadings.length} low reading${lowReadings.length === 1 ? "" : "s"} below ${GLUKOSE_LAV} mmol/L found.`
        : `No readings below ${GLUKOSE_LAV} mmol/L found.`;

    // M-II: Vis tidsrummet for grafens data nederst, fx "Showing data from 06.11.2026 00:00 to 06.11.2026 23:00".
    document.getElementById("dataPeriod").textContent =
        `Showing data from ${formatDateTime(readings[0].timestamp)} to ${formatDateTime(latest.timestamp)}`;

    // Opdatér grafen, listen over lave hændelser og det hyppigste tidspunkt.
    renderChart(readings);
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
    const height = 280;
    const left = 48;
    const right = 16;
    const top = 18;
    const bottom = 60;
    const minValue = 0;
    // Udvid grafens bredde, så der er plads til en synlig etiket for hver time.
    const firstHour = new Date(readings[0].timestamp);
    firstHour.setMinutes(0, 0, 0);
    const lastHour = new Date(readings[readings.length - 1].timestamp);
    lastHour.setMinutes(0, 0, 0);
    const axisEnd = new Date(lastHour);
    axisEnd.setHours(axisEnd.getHours() + 1);
    const axisStart = new Date(firstHour);
    const hourCount = Math.max(1, Math.ceil((axisEnd - firstHour) / (60 * 60 * 1000)));
    const width = Math.max(760, left + right + hourCount * 56);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.style.width = `${width}px`;
    // Udvid skalaen, hvis en måling ligger over grafens normale område.
    const maxValue = Math.max(14, Math.ceil(Math.max(...readings.map(reading => reading.glucose)) / 2) * 2);
    // Placér målingerne efter deres tidspunkter på grafens tidsakse.
    const x = index => xForTime(readings[index].timestamp);
    // Omdan glukoseværdier til lodrette placeringer på grafen.
    const y = value => top + (maxValue - value) / (maxValue - minValue) * (height - top - bottom);

    // Tegn rød zone under målområdet, grøn målzone og rød zone over målområdet.
    // M-II: Zonerne følger de fælles grænser (3.9 og 10.0), så farven passer med Low/High-labels.
    svg.append(svgElement("rect", {
        x: left, y: y(GLUKOSE_LAV), width: width - left - right, height: y(0) - y(GLUKOSE_LAV), class: "out-of-range-band"
    }));
    svg.append(svgElement("rect", {
        x: left, y: y(GLUKOSE_HOEJ), width: width - left - right, height: y(GLUKOSE_LAV) - y(GLUKOSE_HOEJ), class: "range-band"
    }));
    svg.append(svgElement("rect", {
        x: left, y: y(13), width: width - left - right, height: y(GLUKOSE_HOEJ) - y(13), class: "out-of-range-band"
    }));

    // Tilføj vandrette hjælpelinjer og glukoseværdier.
    [0,4, 7, 10, 13].forEach(value => {
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
    // M-II: Husker det forrige punkt med en Low/High-tekst (bruges til at undgå overlap).
    let lastLabel = null;
    readings.forEach((reading, index) => {
        // M-II: Find ud af, om punktet er Low (under 3.9) eller High (over 10.0).
        let type = "";
        if (reading.glucose < GLUKOSE_LAV) type = "low";
        if (reading.glucose > GLUKOSE_HOEJ) type = "high";

        const point = svgElement("circle", {
            cx: x(index), cy: y(reading.glucose), r: 4, class: `chart-point ${type}`
        });
        const title = svgElement("title");
        title.textContent = `${formatDateTime(reading.timestamp)}: ${reading.glucose.toFixed(1)} mmol/L`;
        point.append(title);
        svg.append(point);

        // M-II: Skriv "Low" eller "High" lige over punktet. Ligger det forrige mærkede punkt
        // tæt på (under 40px), skrives teksten under punktet i stedet, så teksterne ikke overlapper.
        if (type) {
            const close = lastLabel && x(index) - lastLabel.x < 40 && lastLabel.above;
            const pointLabel = svgElement("text", {
                x: x(index), y: close ? y(reading.glucose) + 20 : y(reading.glucose) - 10,
                "text-anchor": "middle", class: `chart-point-label ${type}`
            });
            lastLabel = { x: x(index), above: !close };
            pointLabel.textContent = type === "low" ? "Low" : "High";
            svg.append(pointLabel);
        }
    });

    // Tilføj en etiket for hver time, og lad grafen rulle på smalle skærme.
    // Tegn hver timeetiket fast på x-aksen, fra første til sidste måling.
    for (let hour = new Date(firstHour); hour <= lastHour; hour.setHours(hour.getHours() + 1)) {
        const hourX = xForTime(hour);
        svg.append(svgElement("line", {
            x1: hourX, y1: height - bottom, x2: hourX, y2: height - bottom + 5, class: "chart-grid"
        }));
        const label = svgElement("text", {
            x: hourX, y: height - 8, "text-anchor": "middle", class: "chart-label"
        });
        label.textContent = `${String(hour.getHours()).padStart(2, "0")}:00`;
        svg.append(label);
    }

    function xForTime(time) {
        const start = axisStart.getTime();
        const duration = axisEnd.getTime() - start;
        return left + (time.getTime() - start) / duration * (width - left - right);
    }
}

// M-II: Finder lave OG høje hændelser med den fælles funktion findHaendelser (Assets/Glukose.js),
// så Dashboard viser præcis de samme hændelser som History.
function renderLowEvents(readings) {
    // Fjern kort fra det forrige datasæt, før de nye oprettes.
    const container = document.getElementById("lowEvents");
    container.replaceChildren();
    const events = findHaendelser(readings.map(reading => ({ tid: reading.timestamp, vaerdi: reading.glucose })));

    // Vis en besked, hvis der ikke er lave målinger.
    if (events.length === 0) {
        const empty = document.createElement("p");
        // M-II: Teksten passer til perioden på 2 uger
        empty.textContent = "No low or high glucose events today.";
        container.append(empty);
        return;
    }
    // M-II: Vis alle hændelser i perioden (ikke kun seks), med den nyeste først.
    events.slice().reverse().forEach(event => {
        const card = document.createElement("div");
        // M-II: Kortet får klassen "low" eller "high", så det kan farves som grafen.
        card.className = `event-card ${event.type}`;
        const date = document.createElement("strong");
        // M-II: Dato som dag.måned.år via den fælles hjælpefunktion
        date.textContent = formatDato(event.start);
        const time = document.createElement("span");
        time.textContent = event.start.getTime() === event.slut.getTime()
            ? formatTime(event.start)
            : `${formatTime(event.start)} – ${formatTime(event.slut)}`;
        const low = document.createElement("span");
        // M-II: Lave hændelser viser "Lowest", høje viser "Highest".
        low.className = "event-value";
        low.textContent = event.type === "low"
            ? `Lowest: ${event.vaerdi.toFixed(1)} mmol/L`
            : `Highest: ${event.vaerdi.toFixed(1)} mmol/L`;
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

// M-II: Tid og dato bruger nu de fælles funktioner i Assets/Glukose.js
// (24-timers ur i dansk tid og dag.måned.år), så Dashboard og History er ens.
function formatTime(date) {
    return formatTid(date);
}

function formatDateTime(date) {
    return formatDatoTid(date);
}

// Opdatér statusbeskeden, og markér den eventuelt som en fejl.
function setStatus(message, isError = false) {
    dataStatus.textContent = message;
    dataStatus.classList.toggle("error", isError);
}

// Tjek login først (Auth.js). Ikke logget ind: Auth.js sender til login-siden.
// tilpasMenu (Assets/Menu.js) viser/skjuler menupunkter efter brugerens rolle.
// Dataene hentes først, når vi ved, hvem der er logget ind.
visLogin().then(function (bruger) {
    if (!bruger) return;
    tilpasMenu(bruger);
    hentData();
});

// M-II: Dashboardet viser dagens data fra filen sample-glucose.json (et dagsbillede fra CGM-sensoren).
// Før blev tallene hentet fra databasen og kun grafen fra filen. Nu kommer alt fra filen.
// History-siden bruger stadig målingerne i Neon-databasen.
function hentData() {
    fetch("sample-glucose.json")
        .then(response => {
            if (!response.ok) throw new Error("Could not load today's glucose data.");
            return response.json();
        })
        .then(data => {
            renderDashboard(parseReadings(data));
            setStatus("Showing today's readings from the CGM sensor. Import a JSON file to view other readings.");
        })
        .catch(error => setStatus(error.message, true));
}
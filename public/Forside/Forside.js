// Statusbeskeden og det skjulte filfelt
const dataStatus = document.getElementById("dataStatus");
const dataFile = document.getElementById("dataFile");

// Import data-knappen åbner filvælgeren
document.getElementById("importButton").addEventListener("click", function () {
    dataFile.click();
});

// Læser den valgte JSON-fil og viser dens målinger
dataFile.addEventListener("change", async function () {
    const file = dataFile.files[0];
    if (!file) return;

    try {
        const content = await file.text();
        const data = JSON.parse(content);
        renderDashboard(parseReadings(data));
        setStatus("Imported " + file.name, false);
    } catch (error) {
        // SyntaxError betyder, at filen ikke er gyldig JSON
        if (error instanceof SyntaxError) {
            setStatus("Could not read the file. Choose a valid JSON file with a readings array.", true);
        } else {
            setStatus(error.message, true);
        }
    }
    // Nulstilles, så samme fil kan vælges igen
    dataFile.value = "";
});

// Tjekker filens format og laver målinger { timestamp, glucose }
function parseReadings(data) {
    // Filen skal have en ikke-tom liste "readings"
    if (!data || !Array.isArray(data.readings) || data.readings.length === 0) {
        throw new Error('The file must contain a non-empty "readings" array.');
    }

    // Glukose skal være mellem 0 og 40
    const readings = [];
    for (let i = 0; i < data.readings.length; i++) {
        const timestamp = new Date(data.readings[i].timestamp);
        const glucose = Number(data.readings[i].glucose);
        if (isNaN(timestamp.getTime()) || isNaN(glucose) || glucose <= 0 || glucose > 40) {
            throw new Error(`Reading ${i + 1} needs a valid timestamp and glucose value between 0 and 40.`);
        }
        readings.push({ timestamp: timestamp, glucose: glucose });
    }

    // Sorterer efter tidspunkt
    readings.sort(function (a, b) {
        return a.timestamp - b.timestamp;
    });
    return readings;
}

// Beregner og viser alle tal på dashboardet
function renderDashboard(allReadings) {
    // Kun målinger fra den sidste dag i datasættet
    const lastDay = allReadings[allReadings.length - 1].timestamp.toDateString();
    const readings = allReadings.filter(function (reading) {
        return reading.timestamp.toDateString() === lastDay;
    });
    const latest = readings[readings.length - 1];

    // Under 0,2 mmol/L forskel fra forrige måling er Stable
    let trend = "Stable";
    if (readings.length > 1) {
        const difference = latest.glucose - readings[readings.length - 2].glucose;
        if (difference >= 0.2) trend = "Rising";
        if (difference <= -0.2) trend = "Falling";
    }

    // Tæller lave, høje og normale målinger
    const lowReadings = [];
    let highCount = 0;
    let inRange = 0;
    let sum = 0;
    for (const reading of readings) {
        sum = sum + reading.glucose;
        if (reading.glucose < GLUKOSE_LAV) {
            lowReadings.push(reading);
        } else if (reading.glucose > GLUKOSE_HOEJ) {
            highCount = highCount + 1;
        } else {
            inRange = inRange + 1;
        }
    }

    document.getElementById("currentGlucose").textContent = `${latest.glucose.toFixed(1)} mmol/L`;
    document.getElementById("currentTrend").textContent = trend;
    document.getElementById("readingTime").textContent = `Last reading: ${formatDatoTid(latest.timestamp)}`;
    document.getElementById("averageGlucose").textContent = `${(sum / readings.length).toFixed(1)} mmol/L`;
    document.getElementById("timeInRange").textContent = `${Math.round(inRange / readings.length * 100)}%`;
    document.getElementById("readingCount").textContent = readings.length;
    document.getElementById("highCount").textContent = highCount;
    document.getElementById("lowCount").textContent = lowReadings.length;

    // Tekst om antal lave målinger
    let summary = `No readings below ${GLUKOSE_LAV} mmol/L found.`;
    if (lowReadings.length === 1) {
        summary = `1 low reading below ${GLUKOSE_LAV} mmol/L found.`;
    } else if (lowReadings.length > 1) {
        summary = `${lowReadings.length} low readings below ${GLUKOSE_LAV} mmol/L found.`;
    }
    document.getElementById("patternSummary").textContent = summary;

    // Tidsrum, fx "Showing data from 06.11.2026 00:00 to 06.11.2026 23:00"
    document.getElementById("dataPeriod").textContent =
        `Showing data from ${formatDatoTid(readings[0].timestamp)} to ${formatDatoTid(latest.timestamp)}`;

    renderChart(readings);
    renderLowEvents(readings);
    renderFrequentLowPeriod(lowReadings);
}

// Tegner glukosegrafen med SVG-elementer
function renderChart(readings) {
    const svg = document.getElementById("glucoseChart");
    svg.replaceChildren();
    if (readings.length === 0) return;

    // Grafens højde og margener i pixels
    const height = 280;
    const left = 48;
    const right = 16;
    const top = 18;
    const bottom = 60;

    // Tidsaksen går fra hel time før første til hel time efter sidste måling
    const firstHour = new Date(readings[0].timestamp);
    firstHour.setMinutes(0, 0, 0);
    const lastHour = new Date(readings[readings.length - 1].timestamp);
    lastHour.setMinutes(0, 0, 0);
    const axisEnd = new Date(lastHour);
    axisEnd.setHours(axisEnd.getHours() + 1);

    // 56 px pr. time, mindst 760 px
    const hourCount = Math.max(1, Math.ceil((axisEnd - firstHour) / (60 * 60 * 1000)));
    const width = Math.max(760, left + right + hourCount * 56);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.style.width = `${width}px`;

    // Y-aksen går mindst til 14, ellers op til næste lige tal
    let highest = 0;
    for (const reading of readings) {
        if (reading.glucose > highest) highest = reading.glucose;
    }
    const maxValue = Math.max(14, Math.ceil(highest / 2) * 2);

    // x-position ud fra et tidspunkt
    function xForTime(time) {
        const duration = axisEnd.getTime() - firstHour.getTime();
        return left + (time.getTime() - firstHour.getTime()) / duration * (width - left - right);
    }
    // x-position for måling nummer index
    function x(index) {
        return xForTime(readings[index].timestamp);
    }
    // y-position ud fra glukoseværdi (0 i bunden)
    function y(value) {
        return top + (maxValue - value) / maxValue * (height - top - bottom);
    }

    // Rød zone under 3,9, grøn målzone og rød zone over 10,0
    svg.append(svgElement("rect", {
        x: left, y: y(GLUKOSE_LAV), width: width - left - right, height: y(0) - y(GLUKOSE_LAV), class: "out-of-range-band"
    }));
    svg.append(svgElement("rect", {
        x: left, y: y(GLUKOSE_HOEJ), width: width - left - right, height: y(GLUKOSE_LAV) - y(GLUKOSE_HOEJ), class: "range-band"
    }));
    svg.append(svgElement("rect", {
        x: left, y: y(13), width: width - left - right, height: y(GLUKOSE_HOEJ) - y(13), class: "out-of-range-band"
    }));

    // Vandrette hjælpelinjer med værdier
    const gridValues = [0, 4, 7, 10, 13];
    for (const value of gridValues) {
        svg.append(svgElement("line", {
            x1: left, y1: y(value), x2: width - right, y2: y(value), class: "chart-grid"
        }));
        const label = svgElement("text", { x: 4, y: y(value) + 4, class: "chart-label" });
        label.textContent = value;
        svg.append(label);
    }

    // Linje gennem målingerne: "M x y" starter, "L x y" tegner videre
    let path = `M ${x(0)} ${y(readings[0].glucose)}`;
    for (let i = 1; i < readings.length; i++) {
        path = path + ` L ${x(i)} ${y(readings[i].glucose)}`;
    }
    svg.append(svgElement("path", { d: path, class: "chart-line" }));

    // Et punkt for hver måling
    // lastLabel husker forrige Low/High-tekst for at undgå overlap
    let lastLabel = null;
    for (let i = 0; i < readings.length; i++) {
        const reading = readings[i];
        let type = "";
        if (reading.glucose < GLUKOSE_LAV) type = "low";
        if (reading.glucose > GLUKOSE_HOEJ) type = "high";

        const point = svgElement("circle", {
            cx: x(i), cy: y(reading.glucose), r: 4, class: `chart-point ${type}`
        });
        // <title> vises, når musen holdes over punktet
        const title = svgElement("title", {});
        title.textContent = `${formatDatoTid(reading.timestamp)}: ${reading.glucose.toFixed(1)} mmol/L`;
        point.append(title);
        svg.append(point);

        // Low/High over punktet, eller under hvis forrige tekst er under 40 px væk
        if (type) {
            let below = false;
            if (lastLabel !== null && x(i) - lastLabel.x < 40 && lastLabel.above) {
                below = true;
            }
            let labelY = y(reading.glucose) - 10;
            if (below) labelY = y(reading.glucose) + 20;

            const pointLabel = svgElement("text", {
                x: x(i), y: labelY, "text-anchor": "middle", class: `chart-point-label ${type}`
            });
            pointLabel.textContent = type === "low" ? "Low" : "High";
            svg.append(pointLabel);
            lastLabel = { x: x(i), above: !below };
        }
    }

    // Etiket for hver hele time på x-aksen
    for (let hour = new Date(firstHour); hour <= lastHour; hour.setHours(hour.getHours() + 1)) {
        const hourX = xForTime(hour);
        svg.append(svgElement("line", {
            x1: hourX, y1: height - bottom, x2: hourX, y2: height - bottom + 5, class: "chart-grid"
        }));
        const label = svgElement("text", {
            x: hourX, y: height - 8, "text-anchor": "middle", class: "chart-label"
        });
        label.textContent = toCifre(hour.getHours()) + ":00";
        svg.append(label);
    }
}

// Viser lave og høje hændelser som kort (findHaendelser fra Glukose.js)
function renderLowEvents(readings) {
    const container = document.getElementById("lowEvents");
    container.replaceChildren();

    // findHaendelser skal have en liste med { tid, vaerdi }
    const maalinger = [];
    for (const reading of readings) {
        maalinger.push({ tid: reading.timestamp, vaerdi: reading.glucose });
    }
    const events = findHaendelser(maalinger);

    if (events.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "No low or high glucose events today.";
        container.append(empty);
        return;
    }

    // Nyeste hændelse først (baglæns løkke)
    for (let i = events.length - 1; i >= 0; i--) {
        const event = events[i];
        const card = document.createElement("div");
        card.className = `event-card ${event.type}`;

        const date = document.createElement("strong");
        date.textContent = formatDato(event.start);

        const time = document.createElement("span");
        time.textContent = formatTidsrum(event.start, event.slut);

        const value = document.createElement("span");
        value.className = "event-value";
        if (event.type === "low") {
            value.textContent = `Lowest: ${event.vaerdi.toFixed(1)} mmol/L`;
        } else {
            value.textContent = `Highest: ${event.vaerdi.toFixed(1)} mmol/L`;
        }

        card.append(date, time, value);
        container.append(card);
    }
}

// Finder timen med flest lave målinger, fx "03:00 – 04:00"
function renderFrequentLowPeriod(lowReadings) {
    // Én tæller for hver af døgnets 24 timer
    const countPerHour = [];
    for (let hour = 0; hour < 24; hour++) {
        countPerHour.push(0);
    }
    for (const reading of lowReadings) {
        const hour = reading.timestamp.getHours();
        countPerHour[hour] = countPerHour[hour] + 1;
    }

    // Ved lige mange vinder den tidligste time
    let bestHour = -1;
    let bestCount = 0;
    for (let hour = 0; hour < 24; hour++) {
        if (countPerHour[hour] > bestCount) {
            bestHour = hour;
            bestCount = countPerHour[hour];
        }
    }

    const periodElement = document.getElementById("frequentLowPeriod");
    if (bestHour === -1) {
        periodElement.textContent = "No low period";
    } else {
        periodElement.textContent = toCifre(bestHour) + ":00 – " + toCifre((bestHour + 1) % 24) + ":00";
    }
}

// Opretter et SVG-element med attributter
// SVG skal laves med createElementNS, ellers vises det ikke
function svgElement(name, attributes) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", name);
    for (const key in attributes) {
        element.setAttribute(key, attributes[key]);
    }
    return element;
}

// Viser statusbeskeden, rød ved fejl
function setStatus(message, isError) {
    dataStatus.textContent = message;
    dataStatus.classList.toggle("error", isError);
}

// Tjekker login og tilpasser menuen, før data hentes
visLogin().then(function (bruger) {
    if (!bruger) return;
    tilpasMenu(bruger);
    hentData();
});

// Henter dagens CGM-data fra sample-glucose.json
async function hentData() {
    try {
        const response = await fetch("sample-glucose.json");
        if (!response.ok) {
            throw new Error("Could not load today's glucose data.");
        }
        const data = await response.json();
        renderDashboard(parseReadings(data));
        setStatus("Showing today's readings from the CGM sensor. Import a JSON file to view other readings.", false);
    } catch (error) {
        setStatus(error.message, true);
    }
}

// Find statusbeskeden og det skjulte filfelt, så scriptet kan bruge dem.
const dataStatus = document.getElementById("dataStatus");
const dataFile = document.getElementById("dataFile");

// Åbn den skjulte filvælger, når brugeren klikker på importknappen.
document.getElementById("importButton").addEventListener("click", function () {
    dataFile.click();
});

// Læs den valgte JSON-fil, og opdatér dashboardet med dens målinger.
dataFile.addEventListener("change", async function () {
    // Stop, hvis filvælgeren blev lukket uden at vælge en fil.
    const file = dataFile.files[0];
    if (!file) return;

    try {
        // Læs filen, omdan JSON-teksten til data, og kontrollér indholdet.
        const content = await file.text();
        const data = JSON.parse(content);
        renderDashboard(parseReadings(data));
        // Bekræft, at filen blev indlæst.
        setStatus("Imported " + file.name, false);
    } catch (error) {
        // Vis en forklaring, hvis JSON eller glukosemålingerne er ugyldige.
        // SyntaxError betyder, at filen ikke er gyldig JSON.
        if (error instanceof SyntaxError) {
            setStatus("Could not read the file. Choose a valid JSON file with a readings array.", true);
        } else {
            setStatus(error.message, true);
        }
    }
    // Nulstil filvælgeren, så samme fil kan vælges igen.
    dataFile.value = "";
});

// Kontrollér dataenes format, og omdan hver post til en måling { timestamp, glucose }.
function parseReadings(data) {
    // Kræv mindst én måling i listen med navnet "readings".
    if (!data || !Array.isArray(data.readings) || data.readings.length === 0) {
        throw new Error('The file must contain a non-empty "readings" array.');
    }

    // Omdan tidspunkter og glukoseværdier, og afvis ugyldige poster.
    const readings = [];
    for (let i = 0; i < data.readings.length; i++) {
        const timestamp = new Date(data.readings[i].timestamp);
        const glucose = Number(data.readings[i].glucose);
        if (isNaN(timestamp.getTime()) || isNaN(glucose) || glucose <= 0 || glucose > 40) {
            throw new Error(`Reading ${i + 1} needs a valid timestamp and glucose value between 0 and 40.`);
        }
        readings.push({ timestamp: timestamp, glucose: glucose });
    }

    // Sortér efter tidspunkt, så nyeste værdi og grafens rækkefølge er korrekte.
    readings.sort(function (a, b) {
        return a.timestamp - b.timestamp;
    });
    return readings;
}

// Beregn dashboardets tal, og send målingerne til hver visning.
// M-II: ALT på dashboardet (graf, tal, hændelser, mønster og tidsrum) beregnes nu ud fra
// den samme dag, som grafen viser. Før kom tallene fra databasen og grafen fra JSON-filen,
// så tallene under grafen passede ikke til punkterne i grafen.
function renderDashboard(allReadings) {
    // M-II: Brug kun den sidste dag i datasættet, altså præcis de målinger grafen viser.
    const lastDay = allReadings[allReadings.length - 1].timestamp.toDateString();
    const readings = allReadings.filter(function (reading) {
        return reading.timestamp.toDateString() === lastDay;
    });
    // Den sidste måling i den sorterede liste er den nyeste.
    const latest = readings[readings.length - 1];

    // Tendens: sammenlign med den forrige måling. Under 0.2 mmol/L forskel = Stable.
    let trend = "Stable";
    if (readings.length > 1) {
        const difference = latest.glucose - readings[readings.length - 2].glucose;
        if (difference >= 0.2) trend = "Rising";
        if (difference <= -0.2) trend = "Falling";
    }

    // M-II: Tæl lave, høje og normale målinger med de fælles grænser fra Assets/Glukose.js.
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

    // Opdatér den viste værdi, tendens og måletidspunkt.
    document.getElementById("currentGlucose").textContent = `${latest.glucose.toFixed(1)} mmol/L`;
    document.getElementById("currentTrend").textContent = trend;
    document.getElementById("readingTime").textContent = `Last reading: ${formatDatoTid(latest.timestamp)}`;
    // Vis gennemsnittet og andelen i målområdet.
    document.getElementById("averageGlucose").textContent = `${(sum / readings.length).toFixed(1)} mmol/L`;
    document.getElementById("timeInRange").textContent = `${Math.round(inRange / readings.length * 100)}%`;
    // Vis dagens antal målinger.
    document.getElementById("readingCount").textContent = readings.length;
    // M-II: Vis både antal høje og lave målinger under "Readings".
    document.getElementById("highCount").textContent = highCount;
    document.getElementById("lowCount").textContent = lowReadings.length;

    // Fortæl, om der blev fundet lave værdier.
    let summary = `No readings below ${GLUKOSE_LAV} mmol/L found.`;
    if (lowReadings.length === 1) {
        summary = `1 low reading below ${GLUKOSE_LAV} mmol/L found.`;
    } else if (lowReadings.length > 1) {
        summary = `${lowReadings.length} low readings below ${GLUKOSE_LAV} mmol/L found.`;
    }
    document.getElementById("patternSummary").textContent = summary;

    // M-II: Vis tidsrummet for grafens data nederst, fx "Showing data from 06.11.2026 00:00 to 06.11.2026 23:00".
    document.getElementById("dataPeriod").textContent =
        `Showing data from ${formatDatoTid(readings[0].timestamp)} to ${formatDatoTid(latest.timestamp)}`;

    // Opdatér grafen, listen over lave/høje hændelser og det hyppigste tidspunkt.
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

    // Tidsaksen går fra hel time før første måling til hel time efter sidste måling.
    const firstHour = new Date(readings[0].timestamp);
    firstHour.setMinutes(0, 0, 0);
    const lastHour = new Date(readings[readings.length - 1].timestamp);
    lastHour.setMinutes(0, 0, 0);
    const axisEnd = new Date(lastHour);
    axisEnd.setHours(axisEnd.getHours() + 1);

    // Udvid grafens bredde, så der er plads til en synlig etiket for hver time (56 px pr. time).
    const hourCount = Math.max(1, Math.ceil((axisEnd - firstHour) / (60 * 60 * 1000)));
    const width = Math.max(760, left + right + hourCount * 56);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.style.width = `${width}px`;

    // Udvid skalaen, hvis en måling ligger over 14 (rundet op til nærmeste lige tal).
    let highest = 0;
    for (const reading of readings) {
        if (reading.glucose > highest) highest = reading.glucose;
    }
    const maxValue = Math.max(14, Math.ceil(highest / 2) * 2);

    // Vandret placering (x) ud fra et tidspunkt.
    function xForTime(time) {
        const duration = axisEnd.getTime() - firstHour.getTime();
        return left + (time.getTime() - firstHour.getTime()) / duration * (width - left - right);
    }
    // Vandret placering (x) for måling nummer "index".
    function x(index) {
        return xForTime(readings[index].timestamp);
    }
    // Lodret placering (y) ud fra en glukoseværdi. 0 er i bunden, maxValue i toppen.
    function y(value) {
        return top + (maxValue - value) / maxValue * (height - top - bottom);
    }

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
    const gridValues = [0, 4, 7, 10, 13];
    for (const value of gridValues) {
        svg.append(svgElement("line", {
            x1: left, y1: y(value), x2: width - right, y2: y(value), class: "chart-grid"
        }));
        const label = svgElement("text", { x: 4, y: y(value) + 4, class: "chart-label" });
        label.textContent = value;
        svg.append(label);
    }

    // Forbind målingerne med en linje: "M x y" flytter til første punkt, "L x y" tegner videre.
    let path = `M ${x(0)} ${y(readings[0].glucose)}`;
    for (let i = 1; i < readings.length; i++) {
        path = path + ` L ${x(i)} ${y(readings[i].glucose)}`;
    }
    svg.append(svgElement("path", { d: path, class: "chart-line" }));

    // Tegn et punkt for hver måling.
    // M-II: Husker det forrige punkt med en Low/High-tekst (bruges til at undgå overlap).
    let lastLabel = null;
    for (let i = 0; i < readings.length; i++) {
        const reading = readings[i];
        // M-II: Find ud af, om punktet er Low (under 3.9) eller High (over 10.0).
        let type = "";
        if (reading.glucose < GLUKOSE_LAV) type = "low";
        if (reading.glucose > GLUKOSE_HOEJ) type = "high";

        const point = svgElement("circle", {
            cx: x(i), cy: y(reading.glucose), r: 4, class: `chart-point ${type}`
        });
        // <title> vises som lille tekst, når musen holdes over punktet.
        const title = svgElement("title", {});
        title.textContent = `${formatDatoTid(reading.timestamp)}: ${reading.glucose.toFixed(1)} mmol/L`;
        point.append(title);
        svg.append(point);

        // M-II: Skriv "Low" eller "High" lige over punktet. Ligger det forrige mærkede punkt
        // tæt på (under 40px), skrives teksten under punktet i stedet, så teksterne ikke overlapper.
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

    // Tegn en etiket for hver hele time på x-aksen, fra første til sidste måling.
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

// M-II: Finder lave OG høje hændelser med den fælles funktion findHaendelser (Assets/Glukose.js),
// så Dashboard og History finder hændelser på præcis samme måde.
function renderLowEvents(readings) {
    // Fjern kort fra det forrige datasæt, før de nye oprettes.
    const container = document.getElementById("lowEvents");
    container.replaceChildren();

    // findHaendelser forventer en liste med { tid, vaerdi }.
    const maalinger = [];
    for (const reading of readings) {
        maalinger.push({ tid: reading.timestamp, vaerdi: reading.glucose });
    }
    const events = findHaendelser(maalinger);

    // Vis en besked, hvis der ikke er lave eller høje målinger.
    if (events.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "No low or high glucose events today.";
        container.append(empty);
        return;
    }

    // M-II: Vis alle hændelser (ikke kun seks), med den nyeste først (baglæns løkke).
    for (let i = events.length - 1; i >= 0; i--) {
        const event = events[i];
        const card = document.createElement("div");
        // M-II: Kortet får klassen "low" eller "high", så det kan farves som grafen.
        card.className = `event-card ${event.type}`;

        const date = document.createElement("strong");
        // M-II: Dato som dag.måned.år via den fælles hjælpefunktion
        date.textContent = formatDato(event.start);

        const time = document.createElement("span");
        time.textContent = formatTidsrum(event.start, event.slut);

        const value = document.createElement("span");
        // M-II: Lave hændelser viser "Lowest", høje viser "Highest".
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

// Find den time på dagen, hvor der er flest lave målinger, fx "03:00 – 04:00".
function renderFrequentLowPeriod(lowReadings) {
    // Én tæller for hver af døgnets 24 timer.
    const countPerHour = [];
    for (let hour = 0; hour < 24; hour++) {
        countPerHour.push(0);
    }
    for (const reading of lowReadings) {
        const hour = reading.timestamp.getHours();
        countPerHour[hour] = countPerHour[hour] + 1;
    }

    // Find timen med flest. Ved lige mange vinder den tidligste time.
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

// Opret et SVG-element, og sæt dets egenskaber (attributes) til grafen.
// SVG-elementer skal laves med createElementNS, ellers tegner browseren dem ikke.
function svgElement(name, attributes) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", name);
    for (const key in attributes) {
        element.setAttribute(key, attributes[key]);
    }
    return element;
}

// Opdatér statusbeskeden. isError = true gør teksten rød (CSS-klassen "error").
function setStatus(message, isError) {
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

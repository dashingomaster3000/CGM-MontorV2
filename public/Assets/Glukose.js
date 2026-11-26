// Fælles grænser og dato/tid-funktioner for Dashboard og History

// Under 3,9 mmol/L er lav, over 10,0 mmol/L er høj
const GLUKOSE_LAV = 3.9;
const GLUKOSE_HOEJ = 10.0;

// Laver et tal om til to cifre, fx 6 bliver "06"
function toCifre(tal) {
    return String(tal).padStart(2, "0");
}

// Deler et tidspunkt op i dag, måned, år, time og minut
// Tekst fra databasen, fx "2026-11-08 06:00:00", skæres ud direkte
function tidsDele(vaerdi) {
    if (typeof vaerdi === "string") {
        return {
            dag: vaerdi.slice(8, 10),
            maaned: vaerdi.slice(5, 7),
            aar: vaerdi.slice(0, 4),
            time: vaerdi.slice(11, 13) || "00",
            minut: vaerdi.slice(14, 16) || "00"
        };
    }
    return {
        dag: toCifre(vaerdi.getDate()),
        maaned: toCifre(vaerdi.getMonth() + 1), // Januar er 0 i JavaScript
        aar: String(vaerdi.getFullYear()),
        time: toCifre(vaerdi.getHours()),
        minut: toCifre(vaerdi.getMinutes())
    };
}

// Dato som dag.måned.år, fx "08.11.2026"
function formatDato(vaerdi) {
    const d = tidsDele(vaerdi);
    return d.dag + "." + d.maaned + "." + d.aar;
}

// Tid som 24-timers ur, fx "06:00"
function formatTid(vaerdi) {
    const d = tidsDele(vaerdi);
    return d.time + ":" + d.minut;
}

// Dato og tid, fx "08.11.2026 06:00"
function formatDatoTid(vaerdi) {
    return formatDato(vaerdi) + " " + formatTid(vaerdi);
}

// Laver tekst eller Date om til millisekunder
function tilMillisekunder(vaerdi) {
    if (typeof vaerdi === "string") {
        return new Date(vaerdi.replace(" ", "T")).getTime();
    }
    return vaerdi.getTime();
}

// Tidsrum for en hændelse, fx "03:00 – 04:00" eller kun "03:00"
function formatTidsrum(start, slut) {
    if (tilMillisekunder(start) === tilMillisekunder(slut)) {
        return formatTid(start);
    }
    return formatTid(start) + " – " + formatTid(slut);
}

// Finder lave og høje hændelser i en liste med { tid, vaerdi }
// Målinger af samme type inden for 30 minutter samles til én hændelse
function findHaendelser(maalinger) {
    const haendelser = [];
    const halvTime = 30 * 60 * 1000; // 30 minutter i millisekunder

    for (const maaling of maalinger) {
        // Normale målinger springes over
        let type = null;
        if (maaling.vaerdi < GLUKOSE_LAV) type = "low";
        if (maaling.vaerdi > GLUKOSE_HOEJ) type = "high";
        if (!type) continue;

        // Samme type og højst 30 min efter forrige: forlæng hændelsen
        const forrige = haendelser[haendelser.length - 1];
        let taetPaa = false;
        if (forrige && forrige.type === type) {
            taetPaa = tilMillisekunder(maaling.tid) - tilMillisekunder(forrige.slut) <= halvTime;
        }

        if (taetPaa) {
            forrige.slut = maaling.tid;
            // Gemmer laveste værdi for lave og højeste for høje
            if (type === "low") {
                forrige.vaerdi = Math.min(forrige.vaerdi, maaling.vaerdi);
            } else {
                forrige.vaerdi = Math.max(forrige.vaerdi, maaling.vaerdi);
            }
        } else {
            haendelser.push({ type: type, start: maaling.tid, slut: maaling.tid, vaerdi: maaling.vaerdi });
        }
    }
    return haendelser;
}

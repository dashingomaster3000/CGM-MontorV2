// M-II: Fælles hjælpefil for Dashboard og History.
// Her står grænserne for lav/høj glukose og formateringen af dato og tid ét sted,
// så de to sider altid viser det samme.

// M-II: Samme grænser på alle sider (mmol/L). Under 3.9 = Low, over 10.0 = High.
const GLUKOSE_LAV = 3.9;
const GLUKOSE_HOEJ = 10.0;

// M-II: Al tid vises i dansk tid.
const DANSK_TIDSZONE = "Europe/Copenhagen";

// M-II: Deler et tidspunkt op i dag, måned, år, time og minut.
// Tekst fra databasen, fx "2026-11-08 06:00:00", er allerede dansk tid og bruges direkte.
// Et Date-objekt omregnes til dansk tid.
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
    const dele = {};
    new Intl.DateTimeFormat("en-GB", {
        timeZone: DANSK_TIDSZONE,
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(vaerdi).forEach(function (del) {
        dele[del.type] = del.value;
    });
    return { dag: dele.day, maaned: dele.month, aar: dele.year, time: dele.hour, minut: dele.minute };
}

// M-II: Dato som dag.måned.år, fx "08.11.2026".
function formatDato(vaerdi) {
    const d = tidsDele(vaerdi);
    return d.dag + "." + d.maaned + "." + d.aar;
}

// M-II: Tid som 24-timers ur, fx "06:00".
function formatTid(vaerdi) {
    const d = tidsDele(vaerdi);
    return d.time + ":" + d.minut;
}

// M-II: Dato og tid sammen, fx "08.11.2026 06:00".
function formatDatoTid(vaerdi) {
    return formatDato(vaerdi) + " " + formatTid(vaerdi);
}

// M-II: Laver et tidspunkt (tekst fra databasen eller Date) om til millisekunder.
function tilMillisekunder(vaerdi) {
    if (typeof vaerdi === "string") {
        return new Date(vaerdi.replace(" ", "T")).getTime();
    }
    return vaerdi.getTime();
}

// M-II: Fælles funktion, der finder lave og høje hændelser. Bruges af både Dashboard og History,
// så de altid viser de samme hændelser.
// maalinger: liste med { tid, vaerdi }, sorteret efter tid.
// Målinger af samme type (low/high) inden for 30 minutter samles til én hændelse.
// Svar: liste med { type: "low" | "high", start, slut, vaerdi } (vaerdi = laveste/højeste).
function findHaendelser(maalinger) {
    const haendelser = [];
    for (const maaling of maalinger) {
        let type = null;
        if (maaling.vaerdi < GLUKOSE_LAV) type = "low";
        if (maaling.vaerdi > GLUKOSE_HOEJ) type = "high";
        if (!type) continue;

        const forrige = haendelser[haendelser.length - 1];
        const taetPaa = forrige && forrige.type === type &&
            tilMillisekunder(maaling.tid) - tilMillisekunder(forrige.slut) <= 30 * 60 * 1000;
        if (taetPaa) {
            forrige.slut = maaling.tid;
            forrige.vaerdi = type === "low"
                ? Math.min(forrige.vaerdi, maaling.vaerdi)
                : Math.max(forrige.vaerdi, maaling.vaerdi);
        } else {
            haendelser.push({ type: type, start: maaling.tid, slut: maaling.tid, vaerdi: maaling.vaerdi });
        }
    }
    return haendelser;
}

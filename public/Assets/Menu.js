// Fælles kode for menuen (topbaren) på Dashboard, Report symptoms og History.
// Indlæses efter Login/Auth.js og før sidens egen JS.

// Menuens links beholder den valgte patient (?patient=), når man skifter side.
document.querySelectorAll("nav a").forEach(function (link) {
    link.search = window.location.search;
});

// Er brugeren sundhedsprofessionel, vises "Patient list", så man kan gå tilbage og
// vælge en ny borger, og "Report symptoms" skjules, da kun borgere melder symptomer.
function tilpasMenu(bruger) {
    if (bruger.role === "professional") {
        document.getElementById("patientListLink").hidden = false;
        document.getElementById("reportSymptomsLink").hidden = true;
    }
}

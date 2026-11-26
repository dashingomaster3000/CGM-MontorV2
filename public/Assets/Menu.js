// Fælles menukode for Dashboard, Report symptoms og History

// Menuens links beholder ?patient= fra adressen
document.querySelectorAll("nav a").forEach(function (link) {
    link.search = window.location.search;
});

// Sundhedsprofessionelle ser "Patient list" og ikke "Report symptoms"
function tilpasMenu(bruger) {
    if (bruger.role === "professional") {
        document.getElementById("patientListLink").hidden = false;
        document.getElementById("reportSymptomsLink").hidden = true;
    }
}

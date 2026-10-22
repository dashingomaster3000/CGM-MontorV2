document.getElementById("sendKnap").addEventListener("click", function() {
    const tekst = document.getElementById("symptomer").value.trim();
    const dato = document.getElementById("dato").value;
    const fejlBesked = document.getElementById("fejlBesked");

    if (dato === "") {
        fejlBesked.textContent = "Du skal vælge en dato.";
    } else if (tekst === "") {
        fejlBesked.textContent = "Du skal skrive et symptom, før du kan sende.";
    } else {
        fejlBesked.textContent = "Tak for din feedback! Vi har modtaget dine symptomer.";
    }
});

document.getElementById("ForsideKnap").onclick = function() {
    window.location.href = "../Forside/Forside.html";
};
document.getElementById("Historyknap").onclick = function() {
    window.location.href = "../History/History.html";
};
document.getElementById("Loginknap").onclick = function() {
    window.location.href = "../index.html";
};
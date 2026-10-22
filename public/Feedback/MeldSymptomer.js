document.getElementById("sendKnap").addEventListener("click", function() {
    const tekst = document.getElementById("symptomer").value.trim();
    const dato = document.getElementById("dato").value;
    const fejlBesked = document.getElementById("fejlBesked");
    const feedback = document.getElementById("feedback");

    // Tjekker om dato og tekst er udfyldt, og viser fejlbesked hvis ikke
    if (dato === "") {
        fejlBesked.textContent = "Du skal vælge en dato.";
    } else if (tekst === "") {
        fejlBesked.textContent = "Du skal skrive et symptom, før du kan sende.";
    } else {
        feedback.textContent = "Tak for din feedback! Vi har modtaget dine symptomer.";
    }

    //fjerner fejlbeskeden, hvis både dato og tekst er udfyldt
    if(dato && tekst) {
      fejlBesked.textContent = "";
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
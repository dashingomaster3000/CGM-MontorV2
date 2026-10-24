document.getElementById("sendKnap").addEventListener("click", function() {
    const tekst = document.getElementById("symptomer").value.trim();
    const dato = document.getElementById("dato").value;
    const fejlBesked = document.getElementById("fejlBesked");
    const feedback = document.getElementById("feedback");

    // Tjekker om dato og tekst er udfyldt, og viser fejlbesked hvis ikke
    if (dato === "") {
        fejlBesked.textContent = "Please choose a date.";
    } else if (tekst === "") {
        fejlBesked.textContent = "Please describe a symptom before sending.";
    } else {
        feedback.textContent = "Thank you for your feedback! We have received your symptoms.";
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
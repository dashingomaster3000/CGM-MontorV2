document.getElementById("sendKnap").addEventListener("click", function() {
    const input = document.getElementById("symptomer");
    const tekst = input.value.trim();
    const fejlBesked = document.getElementById("fejlBesked");

    if (tekst === "") {
        fejlBesked.textContent = "Du skal skrive et symptom, før du kan sende.";
    } else {
        fejlBesked.textContent = "";
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
     document.getElementById("MeldSymptomerKnap").onclick = function() {
    window.location.href = "../Feedback/MeldSymptomer.html";  
    };
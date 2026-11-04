document.getElementById("Loginknap").onclick = function() {
    sessionStorage.clear(); // Log ud: slet login-data og gå til login-siden.
    window.location.href = "../index.html"; // Går et niveau op og åbner index.html i projektets rod.
    };
    document.getElementById("Historyknap").onclick = function() {
    window.location.href = "../History/History.html";  
    };
     document.getElementById("MeldSymptomerKnap").onclick = function() {
    window.location.href = "../Feedback/MeldSymptomer.html";  
    };
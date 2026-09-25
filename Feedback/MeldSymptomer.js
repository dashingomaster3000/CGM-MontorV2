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
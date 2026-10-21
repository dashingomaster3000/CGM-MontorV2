// Finder formularen og beskedområdet på login-siden.
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

// Håndterer login uden at genindlæse siden.
loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    // Henter og renser de loginoplysninger, som brugeren har indtastet.
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    // Demo-login for en borger
    if (
        email === "borger@diabeto.dk" &&
        password === "borger123"
    ) {
        // Gemmer loginstatus og brugerrolle til brug på den næste side.
        sessionStorage.setItem("diabetoLoggedIn", "true");
        sessionStorage.setItem("diabetoRole", "borger");

        // Sender borgeren til programmets forside.
        window.location.href = "Forside/Forside.html"; // Dette skal vi have ændret til en side for borgere, når den er lavet, eller navnet på forsiden ændres.
    }

    // Demo-login for en sundhedsprofessionel
    else if (
        email === "sundhed@diabeto.dk" &&
        password === "sundhed123"
    ) {
        // Gemmer loginstatus og brugerrolle til brug på den næste side.
        sessionStorage.setItem("diabetoLoggedIn", "true");
        sessionStorage.setItem(
            "diabetoRole",
            "sundhedsprofessionel"
        );

        // Sender den sundhedsprofessionelle til historiksiden.
        window.location.href = "History/History.html"; //Dette skal vi have ændret til en side for sundhedsprofessionelle, når den er lavet.
    }

    // Forkerte loginoplysninger
    else {
        // Viser en besked, når loginoplysningerne ikke passer til en demo-konto.
        loginMessage.textContent =
            "E-mail eller adgangskode er forkert.";
    }
});
// Finder formularen og beskedområdet på login-siden.
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

// Håndterer login uden at genindlæse siden.
loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    loginMessage.textContent = "";

    // Henter og renser de loginoplysninger, som brugeren har indtastet.
    const brugernavn = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
        // Serveren tjekker adgangskoden mod bcrypt-hashen i databasen.
        const response = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ brugernavn, password })
        });

        // Forkerte loginoplysninger
        if (response.status === 400 || response.status === 401) {
            loginMessage.textContent = "Incorrect e-mail or password.";
            return;
        }
        if (!response.ok) {
            loginMessage.textContent = "Login is unavailable. Please try again.";
            return;
        }

        const bruger = await response.json();

        // Sender borgeren til sin egen forside.
        if (bruger.role === "patient") {
            window.location.href = "Forside/Forside.html?patient=" + bruger.patient_id;
        }
        // Sender den sundhedsprofessionelle til patientlisten.
        else {
            window.location.href = "Patients/Patients.html";
        }
    } catch (error) {
        console.error("Could not log in:", error);
        loginMessage.textContent = "Could not connect to the server. Please try again.";
    }
});

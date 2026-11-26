// Formularen og feltet til fejlbeskeder
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

// Logger ind uden at genindlæse siden
loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    loginMessage.textContent = "";

    // E-mail (uden mellemrum) og password fra formularen
    const brugernavn = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
        // Serveren sammenligner password med bcrypt-hashen
        const response = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ brugernavn, password })
        });

        // Forkert e-mail eller password
        if (response.status === 400 || response.status === 401) {
            loginMessage.textContent = "Incorrect e-mail or password.";
            return;
        }
        if (!response.ok) {
            loginMessage.textContent = "Login is unavailable. Please try again.";
            return;
        }

        const bruger = await response.json();

        // Patienter sendes til deres Dashboard
        if (bruger.role === "patient") {
            window.location.href = "Forside/Forside.html?patient=" + bruger.patient_id;
        }
        // Sundhedsprofessionelle sendes til patientlisten
        else {
            window.location.href = "Patients/Patients.html";
        }
    } catch (error) {
        console.error("Could not log in:", error);
        loginMessage.textContent = "Could not connect to the server. Please try again.";
    }
});

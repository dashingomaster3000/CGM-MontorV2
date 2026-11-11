const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    loginMessage.textContent = "";

    const brugernavn = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ brugernavn, password })
        });

        if (response.status === 400 || response.status === 401) {
            loginMessage.textContent = "Incorrect e-mail or password.";
            return;
        }
        if (!response.ok) {
            loginMessage.textContent = "Login is unavailable. Please try again.";
            return;
        }

        const bruger = await response.json();
        if (bruger.role === "patient") {
            window.location.replace("/Forside/Forside.html");
        } else {
            window.location.replace("/Patients/Patients.html");
        }
    } catch (error) {
        console.error("Could not log in:", error);
        loginMessage.textContent = "Could not connect to the server. Please try again.";
    }
});

fetch("/api/me")
    .then((response) => {
        if (response.ok) {
            window.location.replace("/Patients/Patients.html");
        }
    })
    .catch((error) => console.error("Could not check the current session:", error));

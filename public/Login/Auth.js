// Fælles login-tjek og log ud for alle sider, der kræver login.
// Indlæses før sidens egen JS. Må IKKE indlæses på index.html (login-siden).

// Spørg serveren, hvem der er logget ind.
// Ikke logget ind (401): send til login-siden og returnér null.
// Logget ind (200): vis brugernavnet i topbaren og returnér brugeren.
async function visLogin() {
    try {
        const response = await fetch("/api/me");

        if (response.status === 401) {
            window.location.replace("/index.html");
            return null;
        }
        if (!response.ok) {
            return null;
        }

        const bruger = await response.json();
        const currentUser = document.getElementById("currentUser");
        if (currentUser) {
            currentUser.textContent = bruger.brugernavn;
        }
        return bruger;
    } catch (error) {
        // Ingen forbindelse til serveren
        return null;
    }
}

// Log ud: luk sessionen på serveren og gå til login-siden.
async function logUd() {
    try {
        await fetch("/api/logout", { method: "POST" });
    } finally {
        window.location.href = "/index.html";
    }
}

document.getElementById("logoutButton")?.addEventListener("click", logUd);

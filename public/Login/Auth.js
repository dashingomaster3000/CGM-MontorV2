// Fælles login-tjek og log ud for sider, der kræver login
// Indlæses ikke på login-siden (index.html)

// Spørger serveren, hvem der er logget ind
// Ved 401 sendes brugeren til login-siden
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

// Logger ud og går til login-siden
async function logUd() {
    try {
        await fetch("/api/logout", { method: "POST" });
    } finally {
        window.location.href = "/index.html";
    }
}

document.getElementById("logoutButton")?.addEventListener("click", logUd);

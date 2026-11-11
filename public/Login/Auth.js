function showAuthError(message) {
    const target =
        document.getElementById("authMessage") ||
        document.getElementById("message") ||
        document.getElementById("fejlBesked") ||
        document.getElementById("dataStatus");

    if (target) {
        target.textContent = message;
    } else {
        console.error(message);
    }
}

async function visLogin() {
    let response;
    let bruger;

    try {
        response = await fetch("/api/me");
        if (response.status === 401) {
            window.location.replace("/index.html");
            return false;
        }
        if (!response.ok) {
            showAuthError("Could not verify your login. Please try again.");
            return false;
        }
        bruger = await response.json();
    } catch (error) {
        console.error("Could not verify login:", error);
        showAuthError("Could not connect to the server. Please try again.");
        return false;
    }

    const currentUser = document.getElementById("currentUser");
    if (currentUser) {
        currentUser.textContent = bruger.brugernavn;
    }

    return true;
}

async function logUd() {
    const response = await fetch("/api/logout", { method: "POST" });
    if (!response.ok) {
        throw new Error("Could not log out. Please try again.");
    }
    window.location.replace("/index.html");
}

window.visLogin = visLogin;
window.logUd = logUd;

document.getElementById("Loginknap")?.addEventListener("click", async () => {
    try {
        await logUd();
    } catch (error) {
        console.error("Could not log out:", error);
        showAuthError(error.message);
    }
});

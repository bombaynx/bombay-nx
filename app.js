// ============================================
// BOMBAY NX - OWNER AUTHENTICATION
// ============================================

async function getCurrentOwner() {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error || !data || !data.user) {
        return null;
    }

    return data.user;
}


// ============================================
// OWNER LOGIN
// ============================================

async function ownerLogin(email, password) {

    email = email.trim();

    if (!email || !password) {
        throw new Error("Please enter Email and Password.");
    }

    const { data, error } =
        await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

    if (error) {
        throw new Error(error.message);
    }

    if (!data || !data.user) {
        throw new Error("Login failed. Please try again.");
    }

    return data.user;
}


// ============================================
// OWNER LOGOUT
// ============================================

async function ownerLogout() {

    const { error } =
        await supabaseClient.auth.signOut();

    if (error) {
        console.error("Logout error:", error);
    }

    window.location.href = "owner-login.html";
}


// ============================================
// PROTECT OWNER PAGES
// ============================================

async function requireOwnerLogin() {

    const user = await getCurrentOwner();

    if (!user) {
        window.location.href = "owner-login.html";
        return null;
    }

    return user;
}


// ============================================
// IF ALREADY LOGGED IN
// ============================================

async function redirectIfLoggedIn() {

    const user = await getCurrentOwner();

    if (user) {
        window.location.href = "dashboard.html";
    }
}
```javascript
// ==========================================
// BOMBAY NX - AUTH
// ==========================================

async function getCurrentUser() {

    const { data, error } =
        await window.supabaseClient.auth.getUser();

    if (error || !data.user) {
        return null;
    }

    return data.user;
}


// ==========================================
// GET OWNER PROFILE
// ==========================================

async function getOwnerProfile(userId) {

    const { data, error } =
        await window.supabaseClient
            .from("owner_profile")
            .select("*")
            .eq("id", userId)
            .maybeSingle();

    if (error) {
        console.error(error);
        return null;
    }

    return data;
}


// ==========================================
// LOGIN
// ==========================================

async function ownerLogin(email, password) {

    const { data, error } =
        await window.supabaseClient.auth
            .signInWithPassword({
                email: email.trim(),
                password: password
            });

    if (error) {
        throw new Error(error.message);
    }

    const profile =
        await getOwnerProfile(data.user.id);

    if (!profile) {

        await window.supabaseClient.auth.signOut();

        throw new Error(
            "This account is not registered as an Owner."
        );
    }

    return {
        user: data.user,
        profile: profile
    };
}


// ==========================================
// LOGOUT
// ==========================================

async function ownerLogout() {

    await window.supabaseClient.auth.signOut();

    window.location.href =
        "owner-login.html";
}


// ==========================================
// PROTECT PAGES
// ==========================================

async function requireOwnerLogin() {

    const user =
        await getCurrentUser();

    if (!user) {

        window.location.href =
            "owner-login.html";

        return null;
    }

    const profile =
        await getOwnerProfile(user.id);

    if (!profile) {

        await window.supabaseClient.auth.signOut();

        window.location.href =
            "owner-login.html";

        return null;
    }

    return {
        user: user,
        profile: profile
    };
}
```

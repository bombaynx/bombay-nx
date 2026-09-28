// ==========================================
// BOMBAY NX
// OWNER SIGNUP
// MAXIMUM 2 OWNERS
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    const signupForm =
        document.getElementById("signupForm");

    if (!signupForm) {
        console.error("signupForm not found");
        return;
    }


    signupForm.addEventListener(
        "submit",
        async function (e) {

            e.preventDefault();


            const ownerName =
                document.getElementById("ownerName")
                    .value.trim();

            const mobile =
                document.getElementById("ownerMobile")
                    .value.trim();

            const email =
                document.getElementById("ownerEmail")
                    .value.trim();

            const password =
                document.getElementById("ownerPassword")
                    .value;

            const confirmPassword =
                document.getElementById("confirmPassword")
                    .value;

            const message =
                document.getElementById("signupMessage");

            const button =
                signupForm.querySelector(
                    "button[type='submit']"
                );


            message.className = "message";
            message.textContent = "";


            // ------------------------------
            // VALIDATION
            // ------------------------------

            if (!ownerName) {

                message.className =
                    "message error";

                message.textContent =
                    "Please enter owner name.";

                return;
            }


            if (!mobile) {

                message.className =
                    "message error";

                message.textContent =
                    "Please enter mobile number.";

                return;
            }


            if (!email) {

                message.className =
                    "message error";

                message.textContent =
                    "Please enter email.";

                return;
            }


            if (password.length < 6) {

                message.className =
                    "message error";

                message.textContent =
                    "Password must be at least 6 characters.";

                return;
            }


            if (password !== confirmPassword) {

                message.className =
                    "message error";

                message.textContent =
                    "Passwords do not match.";

                return;
            }


            button.disabled = true;
            button.textContent = "CHECKING...";


            try {

                // ------------------------------
                // CHECK OWNER COUNT
                // ------------------------------

                const {
                    data: ownerCount,
                    error: countError
                } =
                    await window.supabaseClient
                        .rpc("get_owner_count");


                if (countError) {
                    throw countError;
                }


                const count =
                    Number(ownerCount || 0);


                console.log(
                    "Current owner count:",
                    count
                );


                // ------------------------------
                // MAXIMUM 2 OWNERS
                // ------------------------------

                if (count >= 2) {

                    throw new Error(
                        "Maximum 2 owner accounts are already registered."
                    );

                }


                const ownerSlot =
                    count === 0 ? 1 : 2;


                button.textContent =
                    "CREATING ACCOUNT...";


                // ------------------------------
                // CREATE SUPABASE AUTH USER
                // ------------------------------

                const {
                    data,
                    error
                } =
                    await window.supabaseClient
                        .auth
                        .signUp({

                            email: email,

                            password: password,

                            options: {

                                data: {

                                    owner_name:
                                        ownerName,

                                    mobile:
                                        mobile,

                                    owner_slot:
                                        ownerSlot

                                }

                            }

                        });


                if (error) {
                    throw error;
                }


                if (!data.user) {

                    throw new Error(
                        "Unable to create owner account."
                    );

                }


                // ------------------------------
                // CREATE OWNER PROFILE
                // ------------------------------

                const {
                    error: profileError
                } =
                    await window.supabaseClient
                        .from("owner_profile")
                        .insert({

                            id:
                                data.user.id,

                            owner_name:
                                ownerName,

                            mobile:
                                mobile,

                            email:
                                email,

                            shop_name:
                                "BOMBAY NX",

                            owner_slot:
                                ownerSlot

                        });


                if (profileError) {
                    throw profileError;
                }


                // ------------------------------
                // SUCCESS
                // ------------------------------

                message.className =
                    "message success";

                message.textContent =
                    "Owner " +
                    ownerSlot +
                    " account created successfully.";


                signupForm.reset();


                button.disabled = false;
                button.textContent =
                    "CREATE ACCOUNT";


                setTimeout(function () {

                    openLogin();

                }, 1500);


            } catch (error) {

                console.error(
                    "Signup Error:",
                    error
                );


                message.className =
                    "message error";

                message.textContent =
                    error.message ||
                    "Account creation failed.";


                button.disabled = false;

                button.textContent =
                    "CREATE ACCOUNT";

            }

        }

    );

});
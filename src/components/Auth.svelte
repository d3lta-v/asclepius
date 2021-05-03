<script lang="ts">
    // =======================================================================
    // Imports
    import {fade, slide} from "svelte/transition"
    import ErrorAlert from "./ErrorAlert.svelte";
    import firebase from "firebase/app";
    import {auth} from "../services/firebase";
    import {createEventDispatcher} from "svelte";
    import { onMount, afterUpdate } from 'svelte';

    // =======================================================================
    // Variables and constants
    const d = createEventDispatcher();

    let isAuthenticated = false;
    let captchaConfirmation: firebase.auth.ConfirmationResult = null;
    let appVerifier: firebase.auth.RecaptchaVerifier = null;

    // =======================================================================
    // UI elements
    let ui_errorMessageDisplay: string | null = null;
    let ui_phoneNumberField: HTMLInputElement;
    let ui_verificationNumberField: HTMLInputElement;
    let ui_loginButton: HTMLButtonElement;

    // =======================================================================
    // Lifecycle
    onMount(() => {
        console.log("onMount called");
        ui_phoneNumberField = document.getElementById("i_phoneNo") as HTMLInputElement;
        ui_loginButton = document.getElementById("i_login") as HTMLButtonElement;
    });

    afterUpdate(() => {
        // Create CAPTCHA when afterUpdate is called so that the right captcha gets called

        console.log("afterUpdate called");
        // check if UI for login exists AND that CAPTCHA verifier is null
        if (document.getElementById("i_phoneNo") && !appVerifier) {
            createCaptchaVerifier();
        }
    });

    // This will check when the authentication state changes so that the user gets directed to the right place
    auth.onAuthStateChanged(user => {
        isAuthenticated = !!user;
        if (user) {
            d("auth");
            d("done");
        }
    });

    // =======================================================================
    // Functions

    function createCaptchaVerifier() {
        if (!appVerifier) {
            appVerifier = new firebase.auth.RecaptchaVerifier('i_login', {
                'size': 'invisible',
                'callback': (response) => {
                    console.log("CAPTCHA solved: ", response);
                    // reCAPTCHA solved, initialise the login flow from here
                    login();
                },
                'expired-callback': () => {
                    // Response expired. Ask user to solve reCAPTCHA again.
                    // ...
                    ui_errorMessageDisplay = "reCAPTCHA error, please solve reCAPTCHA again";
                }
            });

            // Pre-render CAPTCHA widget
            // need to verify if the element exists
            // if ()
            appVerifier.render();
        } else {
            console.log("app verifier is already created, no need to create it a second time");
        }
    }

    function login() {
        ui_errorMessageDisplay = null; // reset error message display

        let phoneNo = ui_phoneNumberField.value;
        // perform some input validation
        const phoneNoValid = phoneNo.length == 8 && (phoneNo.startsWith("8") || phoneNo.startsWith("9") || phoneNo.startsWith("7"));
        if (!phoneNoValid) {
            ui_errorMessageDisplay = "Phone number is invalid! Only Singaporean mobile phone numbers (8 digits) is allowed.";
            return;
        }
        phoneNo = "+65" + phoneNo.trim();

        console.log("App captcha verifier: ", appVerifier);
        auth.signInWithPhoneNumber(phoneNo, appVerifier)
        .then((confirmationResult) => {
            // SMS sent. Prompt user to type the code from the message, then sign the user in with 
            // confirmationResult.confirm(code).
            captchaConfirmation = confirmationResult; // This triggers a UI change automatically
        }).catch((error) => {
            // Due to some error, SMS was not sent
            console.error(error);
            ui_errorMessageDisplay = error;
        });
    }

    function confirmCaptchaCallback() {
        ui_verificationNumberField = document.getElementById("i_verificationNo") as HTMLInputElement;
        // TODO: should do some basic validation
        captchaConfirmation.confirm(ui_verificationNumberField.value).then((result) => {
            const user = result.user;
            console.log("User logged in as ", user);
            isAuthenticated = true;
        }).catch((error) => {
            // User couldn't sign in (bad verification code?)
            // ...
            // TODO: show error to user
            console.error(error);
            ui_errorMessageDisplay = error;
        });
    }

    function logout() {
        ui_errorMessageDisplay = null;
        console.log("Logging out...")
        // destroy the captcha instance so that we can recreate it next time
        captchaConfirmation = null;
        appVerifier.clear();
        appVerifier = null;
        // Actually sign out
        if (auth.currentUser) {
            auth.signOut().then(() => {
                // Sign-out successful.
                console.log("User signed out");
                // Dispatch logout event
                d("logout");
                d("done");
                isAuthenticated = false;
            }).catch((error) => {
                // An error happened.
                console.error(error);
            });
        }
    }

    // function google() {}
</script>

<div class="container">
    {#if !isAuthenticated}
    <h3>Log In</h3>
    {#if ui_errorMessageDisplay}
    <ErrorAlert message={ui_errorMessageDisplay} />
    {/if}
    <form in:fade on:submit|preventDefault>
        <div class="row">
            <div class="three columns">
                <label for="i_phoneNo">Phone Number</label>
                <input class="u-full-width" type="tel" placeholder="91234567" id="i_phoneNo" style="margin-bottom: 1em;">
                <input class="button-primary" type="submit" value="Login" id="i_login">
            </div>
        </div>
    </form>
    {#if captchaConfirmation}
    <div in:slide class="row">
        <div class="three columns">
            <label for="i_verificationNo" style="margin-top: 0.5em;">Verification Code:</label>
            <input class="u-full-width" type="text" placeholder="123456" id="i_verificationNo" style="margin-bottom: 1em;">
            <button class="button" on:click={confirmCaptchaCallback}>Verify</button>
        </div>
    </div>
    {/if}
    {:else}
    <div class="row">
        <h5>Logged in</h5>
        <p>You are being redirected to the correct page right now... if this takes too long, you can try to log out and try again with the log out button below:</p>
        <button class="button-primary" type="button" on:click={logout}>Logout</button>
    </div>
    {/if}
</div>
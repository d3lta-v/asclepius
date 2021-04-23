<script lang="ts">
    // =======================================================================
    // Imports
    import {fade, slide} from "svelte/transition"
    import ErrorAlert from "./ErrorAlert.svelte";
    import firebase from "firebase/app";
    import {auth} from "../services/firebase";
    import {createEventDispatcher} from "svelte";
    import { onMount } from 'svelte';

    // =======================================================================
    // Variables and constants
    const d = createEventDispatcher();

    // export let authMode: "login" | "register" = "register";
    let isAuthenticated = false;
    let captchaConfirmation: firebase.auth.ConfirmationResult = null;
    let appVerifier: firebase.auth.RecaptchaVerifier = null;

    // =======================================================================
    // UI elements
    let ui_errorMessageDisplay: string | null = null;
    let ui_phoneNumberField: HTMLInputElement;
    let ui_verificationNumberField: HTMLInputElement;

    // =======================================================================
    // Lifecycle
    onMount(() => {
        console.log("onMount called");
        ui_phoneNumberField = document.getElementById("i_phoneNo") as HTMLInputElement;
        // Create CAPTCHA
        // TODO: might need to redo this every time after user logs out due to reCAPTCHA client element has been removed: 0
        createCaptchaVerifier();
    });

    // =======================================================================
    // Functions

    function createCaptchaVerifier() {
        appVerifier = new firebase.auth.RecaptchaVerifier('i_login', {
            'size': 'invisible',
            'callback': (response) => {
                console.log("CAPTCHA solved: ", response);
                // reCAPTCHA solved, allow signInWithPhoneNumber.
                // onSignInSubmit();
            },
            'expired-callback': () => {
                // Response expired. Ask user to solve reCAPTCHA again.
                // ...
                ui_errorMessageDisplay = "reCAPTCHA error, please solve reCAPTCHA again";
            }
        });
    }

    function login() {
        ui_errorMessageDisplay = null; // reset error message display
        // Create captcha instance if it's null
        if (!appVerifier) {
            createCaptchaVerifier();
        }
        console.log("logging in...");
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

    // function register() {}

    function logout() {
        ui_errorMessageDisplay = null;
        console.log("Logging out...")
        // destroy the captcha instance so that we can recreate it next time
        appVerifier.clear();
        appVerifier = null;
        // Actually sign out
        if (auth.currentUser) {
            auth.signOut().then(() => {
                // Sign-out successful.
                console.log("User signed out");
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
    <form in:fade on:submit|preventDefault={login}>
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
            <button on:click={confirmCaptchaCallback}>Verify</button>
        </div>
    </div>
    {/if}
    {:else}
    <h2>Logged In</h2>
    <div class="row">
        <button class="button-primary" type="button" value="Logout" on:click={logout}>
    </div>
    {/if}
</div>
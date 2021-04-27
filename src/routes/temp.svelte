<script lang="ts">
    // =======================================================================
    // Imports
    import {auth} from "../services/firebase";
    import {fade} from "svelte/transition";
    import {createEventDispatcher} from "svelte";

    // =======================================================================
    // Variables and constants
    let isAdminUser = true;
    let isAuthenticated = false;
    const d = createEventDispatcher();

    // =======================================================================
    // Functions

    function logout() {
        // ui_errorMessageDisplay = null;
        console.log("Logging out...")
        // destroy the captcha instance so that we can recreate it next time
        // captchaConfirmation = null;
        // appVerifier.clear();
        // appVerifier = null;
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
</script>

<div class="container">
    <div class="row">
        <div class="six columns">
            <h5 style="margin-top: 1em; margin-bottom: 0; display: inline-block;">Asclepius Temperature Recording Portal</h5>
        </div>
        <div class="six columns topbar">
            {#if isAdminUser}
            <a class="button button-primary" style="margin-right: 0em;" href="/temp">Take Temperature</a>
            <a class="button" style="margin-right: 0em;" href="/admin">Admin Panel</a>
            {/if}
            <button class="button topbar-loginBtn" on:click={logout}>Log Out</button>
        </div>
    </div>
    <hr />
    <div class="row">
        <p>You have not yet submitted your AM temperature yet.</p>
    </div>
    <div class="row">
        <form in:fade>
            <div class="row">
                <div class="seven columns">
                    <label for="i_phoneNo">Submit your temperature below (e.g. 36.6) in degrees Celsius</label>
                    <input class="u-full-width" type="number" placeholder="36.6" id="i_temperature" style="margin-bottom: 1em;">
                    <input class="button-primary" type="submit" value="Submit Temperature" min="30" max="50" id="i_login">
                </div>
            </div>
        </form>
    </div>
</div>
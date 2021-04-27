<script lang="ts">
    // =======================================================================
    // Imports
    import {auth} from "../services/firebase";
    import {createEventDispatcher} from "svelte";

    // =======================================================================
    // Variables and constants
    let isAdminUser = true;
    let isAuthenticated = false;
    const d = createEventDispatcher();
    
    // =======================================================================
    // Lifecycle

    // Login check
    auth.onAuthStateChanged(user => {
        isAuthenticated = !!user;
        if (user) {
            console.log("Current user phone no.: ", user.phoneNumber);
            // TODO: validate whether the user is an superuser
        } else {
            console.log("User is null");
            window.location.href = "/"; // kick the user out to login page
        }
    });

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
            <a class="button" style="margin-right: 0em;" href="/temp">Take Temperature</a>
            <a class="button button-primary" style="margin-right: 0em;" href="/admin">Admin Panel</a>
            {/if}
            <button class="button topbar-loginBtn" on:click={logout}>Log Out</button>
        </div>
    </div>
    <hr />
    <div class="row">
        <table class="u-full-width">
            <thead>
                <tr>
                    <th>S/N</th>
                    <th>Phone No.</th>
                    <th>Name</th>
                    <th>AM (&deg;C)</th>
                    <th>PM (&deg;C)</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="centred-td">1</td>
                    <td>91478066</td>
                    <td>Pan Ziyue</td>
                    <td>36.5</td>
                    <td>36.6</td>
                    <td>
                        <button class="compactBtn">Edit</button>
                        <button class="compactBtn">⬆️</button>
                        <button class="compactBtn">⬇️</button>
                        <button class="compactBtn">🗑️</button>
                    </td>
                </tr>
                <tr>
                    <td class="centred-td">2</td>
                    <td><input type="tel" placeholder="91234567" value="70000000"></td>
                    <td><input type="text" placeholder="Name" value="John Smith"></td>
                    <td><input class="number-field" type="number" placeholder="AM Temp" value="36.5" step="0.1" max="45" min="30"></td>
                    <td><input class="number-field" type="number" placeholder="PM Temp" value="36.5" step="0.1" max="45" min="30"></td>
                    <td>
                        <button class="compactBtn">Done</button>
                        <button class="compactBtn">⬆️</button>
                        <button class="compactBtn">⬇️</button>
                        <button class="compactBtn">🗑️</button>
                    </td>
                </tr>
                <tr>
                    <td class="centred-td">N/A</td>
                    <td><input type="tel" placeholder="91234567"></td>
                    <td><input type="text" placeholder="New Name Here"></td>
                    <td>N/A</td>
                    <td>N/A</td>
                    <td>
                        <button class="compactBtn">Add</button>
                    </td>
                </tr>
            </tbody>
          </table>
    </div>
</div>

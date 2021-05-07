<script lang="ts">
    // =======================================================================
    // Imports
    import {auth} from "../services/firebase";
    import {createEventDispatcher} from "svelte";
    import InfoRow from "../components/InfoRow.svelte"

    // =======================================================================
    // Variables and constants
    let isAdminUser = true;
    let isAuthenticated = false;
    const d = createEventDispatcher();

    interface TemperatureRow {
        serialNo: number,
        phoneNo: string,
        authorName: string, // Name of author, based on phone number matching
        amTemperature: number,
        pmTemperature: number
    };

    let temperatureRecords: TemperatureRow[] = [];
    
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
                {#if temperatureRecords.length > 0}
                    {#each temperatureRecords as temp}
                        <InfoRow></InfoRow>
                    {/each}
                {:else}
                    <tr>
                        <td class="centred-td"></td>
                        <td></td>
                        <td>No Data</td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                {/if}
            </tbody>
          </table>
    </div>
</div>

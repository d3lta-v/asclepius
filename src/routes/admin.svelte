<script lang="ts">
    // =======================================================================
    // Imports
    import { auth } from "../services/firebase";
    import { createEventDispatcher } from "svelte";
    import AdminSingleDay from "../components/AdminSingleDay.svelte"
    import AdminWeek from "../components/AdminWeek.svelte"

    // =======================================================================
    // Variables and constants
    let isAdminUser = true;
    let isAuthenticated = false;
    
    const d = createEventDispatcher();
    

    // =======================================================================
    // UI

    // The following variables defines which button is unhighlighted and which are highlighted (primary)
    let ui_tabButtons = "day";

    // =======================================================================
    // Functions

    function logout() {
        // ui_errorMessageDisplay = null;
        console.log("Logging out...")
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

<div class="container" style="max-width: 1080px">
    <div class="row">
        <div class="eight columns">
            <h5 style="margin-top: 1em; margin-bottom: 0; display: inline-block;">Asclepius Temperature Recording Portal</h5>
        </div>
        <div class="four columns topbar">
            {#if isAdminUser}
                <a class="button" style="margin-right: 0em; font-size: 14px;" href="/temp"><i class="fas fa-thermometer-quarter"></i></a>
                <a class="button button-primary" style="margin-right: 0em; font-size: 14px;" href="/admin"><i class="fas fa-columns"></i></a>
            {/if}
            <button class="button topbar-loginBtn" type="button" style="font-size: 14px;" on:click={logout}><i class="fas fa-sign-out-alt"></i></button>
        </div>
    </div>
    <hr style="margin-bottom: 25px" />
    <div class="row" style="margin-bottom: 20px">
        <!--This row will act as a function selection bar-->
        <button type="button" id="dayBtn" class="{ui_tabButtons === 'day' ? "button button-primary" : "button"}" on:click={() => ui_tabButtons = 'day'}><i class="fas fa-calendar-day"></i> Day View</button>
        <button type="button" id="weekBtn" class="{ui_tabButtons === 'week' ? "button button-primary" : "button"}" on:click={() => ui_tabButtons = 'week'}><i class="fas fa-calendar-week"></i> Week View</button>
    </div>
    {#if ui_tabButtons === 'day'}
        <AdminSingleDay></AdminSingleDay>
    {:else if ui_tabButtons === 'week'}
        <AdminWeek></AdminWeek>
    {/if}
</div>

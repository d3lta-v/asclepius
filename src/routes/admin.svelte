<script lang="ts">
    // =======================================================================
    // Imports
    import {auth, db} from "../services/firebase";
    import {createEventDispatcher} from "svelte";
    import InfoRow from "../components/InfoRow.svelte"

    // =======================================================================
    // Variables and constants
    let isAdminUser = true;
    let isAuthenticated = false;
    let adminListenerCreated = false;
    const d = createEventDispatcher();
    let unsubAdminListener: () => any;

    interface TemperatureRow { // This interface describes the structure of a row of data
        serialNo: number,
        phoneNo: string,
        authorName: string, // Name of author, based on phone number matching
        amTemperature: number | null,
        pmTemperature: number | null,
        editing: boolean,
        newRow: boolean
        id: string | null
    };

    let temperatureRecords: TemperatureRow[] = [];
    
    // =======================================================================
    // Lifecycle

    // Login check
    auth.onAuthStateChanged(user => {
        isAuthenticated = !!user;
        if (user) {
            db.collection("roles").doc(user.uid).get()
            .then((doc) => {
                if (!doc.exists){
                    console.log("user roles for this user does not exist, creating default user role")
                    db.collection("roles").doc(user.uid).set({user: true});
                } else {
                    console.log("User roles: ", doc.data());
                    // Check if user is admin
                    if (!doc.data().admin) {
                        window.location.href = "/temp"; // kick the user out to temperature page
                    }
                }
            });
            if (!adminListenerCreated) {
                createAdminListener();
                adminListenerCreated = true;
            }
        } else {
            console.log("User is null");
            window.location.href = "/"; // kick the user out to login page
        }
    });

    // =======================================================================
    // Functions

    function createAdminListener() {
        unsubAdminListener = db.collection("namemap").orderBy("serialNo").onSnapshot((snapshot) => {
            // Pop the last "new row" element
            if (temperatureRecords.length > 0) {
                temperatureRecords.pop();
            }

            // Perform changes in the data model
            snapshot.docChanges().forEach((change) => {
                // Perform all UI calls here
                if (change.type === "added") {
                    const data = change.doc.data();
                    console.log("Added record with id ", change.doc.id, " and data: ", data);
                    temperatureRecords.push({
                        phoneNo: data.phoneNo,
                        serialNo: data.serialNo,
                        authorName: data.authorName,
                        amTemperature: null,
                        pmTemperature: null,
                        editing: false,
                        newRow: false,
                        id: change.doc.id
                    });
                }
                if (change.type === "modified") {
                    const data = change.doc.data();
                    console.log("Modified record with id ", change.doc.id, " and data: ", data);
                    const index = temperatureRecords.map(e => e.id).indexOf(change.doc.id);
                    temperatureRecords[index] = {
                        phoneNo: data.phoneNo,
                        serialNo: data.serialNo,
                        authorName: data.authorName,
                        amTemperature: null,
                        pmTemperature: null,
                        editing: false,
                        newRow: false,
                        id: change.doc.id
                    };
                }
                if (change.type === "removed") {
                    console.log("Removed record: ", change.doc.data());
                    const index = temperatureRecords.map(e => e.id).indexOf(change.doc.id);
                    temperatureRecords.splice(index,index);
                }
                temperatureRecords = temperatureRecords;
            });

            // Add the New row for users to add phone numbers
            temperatureRecords.push({
                phoneNo: "",
                serialNo: temperatureRecords.length+1,
                authorName: "",
                amTemperature: null,
                pmTemperature: null,
                editing: false,
                newRow: true,
                id: null
            });

            // Sort by serial number
            temperatureRecords.sort(function(a, b){return a.serialNo-b.serialNo});
        });
    }

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
                        <InfoRow {...temp}></InfoRow>
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

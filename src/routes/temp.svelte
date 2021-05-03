<script lang="ts">
    // =======================================================================
    // Imports
    import {auth, db} from "../services/firebase";
    import {fade} from "svelte/transition";
    import {createEventDispatcher} from "svelte";
    import { onMount } from 'svelte';
    import firebase from "firebase/app";

    // =======================================================================
    // Variables and constants
    let isAdminUser = true;
    let isAuthenticated = false;
    const d = createEventDispatcher();

    interface User {
        phoneNumber: string, author: string
    }

    interface TemperatureRecord extends User {
        temperature: number, submitted: firebase.firestore.Timestamp
    }

    // =======================================================================
    // UI elements
    let ui_temperatureField: HTMLInputElement;

    // =======================================================================
    // Lifecycle
    onMount(() => {
        ui_temperatureField = document.getElementById("i_temperature") as HTMLInputElement;
    });

    // Login check
    auth.onAuthStateChanged(user => {
        isAuthenticated = !!user;
        if (user) {
            // TODO: validate whether the user is an superuser
            // Once login flow is completed, verify that /roles have at least 1 key, and if not, create it
            db.collection("roles").doc(user.uid).get()
            .then((doc) => {
                if (!doc.exists){
                    console.log("user roles for this user does not exist, creating default user role")
                    db.collection("roles").doc(user.uid).set({user: true});
                }
            });
            temperatureStatus(user.uid); //TODO DELETE THIS LINE
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

    function submitTemperature() {
        // Get user information
        const user = auth.currentUser
        if (!user) {
            console.log("User is null");
            window.location.href = "/";
            return;
        }

        // Validate temperature
        const temperature = parseFloat(ui_temperatureField.value);
        if (temperature > 50 || temperature < 32) {
            window.alert("Invalid temperature! Please key your body temperature in degrees Celcius with decimal points (e.g. 36.5)");
            return;
        }

        const record: TemperatureRecord = {
            temperature: temperature,
            submitted: firebase.firestore.Timestamp.now(),
            phoneNumber: user.phoneNumber,
            author: user.uid
        }
        db.collection("temperatures").add(record);
    }

    function temperatureStatus(uid: string) {
        // This function checks if the user has already sent 
        // Get the today's date by setting the upper and lower bounds to look for (which by default are current time objects)
        const upperDateBoundary = new Date();
        const lowerDateBoundary = new Date();

        const currentHour = upperDateBoundary.getHours();
        const ampm = currentHour >= 12 ? "pm" : "am";
        const correctTimezone = upperDateBoundary.getTimezoneOffset() === -480; //TODO: add a configuration option for this value

        if (ampm === "am") {
            upperDateBoundary.setHours(0,0,0,0);
            lowerDateBoundary.setHours(12,0,0,0);
        } else {
            upperDateBoundary.setHours(12,0,0,1);
            lowerDateBoundary.setHours(23,59,59,0);
        }

        if (!correctTimezone) {
            //TODO: tell the user that their phone might be set to the wrong timezone
            console.log("Wrong timezone! Aborting");
            return;
        }

        // Create date range to query
        console.log("UID: ", uid);

        db.collection("temperatures")
        .where("author", "==", uid)
        // .where("submitted", "<=", firebase.firestore.Timestamp.fromDate(lowerDateBoundary))
        // .where("submitted", ">=", firebase.firestore.Timestamp.fromDate(upperDateBoundary))
        .get()
        .then((querySnapshot) => {
            console.log("Snapshot received: ");
            if (querySnapshot.empty) {
                console.log("snapshot is empty");
                return;
            }
            querySnapshot.forEach(doc => {
                if (doc.exists) {
                    console.log(doc.id, " => ", doc.data());
                } else {
                    // doc.data() will be undefined in this case
                    console.log("No such document!");
                }
            });
        }).catch((error) => {
            console.log("Error getting document:", error);
        });

        // if (ampm == "am") {
        //     // Query for AM temperature
        // } else if (ampm == "pm") {
        //     // Query for PM temperature
        // }
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
        <button>Submit Again</button>
    </div>
    <div class="row">
        <form in:fade on:submit|preventDefault={submitTemperature}>
            <div class="seven columns">
                <label for="i_phoneNo">Submit your temperature below (e.g. 36.6) in degrees Celsius</label>
                <input class="u-full-width" type="number" placeholder="36.6" id="i_temperature" style="margin-bottom: 1em;" step="0.1" max="45" min="30">
                <input class="button-primary" type="submit" value="Submit Temperature" id="i_login">
            </div>
        </form>
    </div>
</div>
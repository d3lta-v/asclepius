<script lang="ts">
    // =======================================================================
    // Imports
    import { auth, db } from "../services/firebase";
    import { fade } from "svelte/transition";
    import { createEventDispatcher } from "svelte";
    import { afterUpdate, onDestroy } from 'svelte';
    import firebase from "firebase/app";

    // =======================================================================
    // Variables and constants

    // UI elements
    let ui_isAdminUser = false;
    let ui_isVerified = false; // whether the user and temperature records are checked already
    let ui_temperatureSubmitted = false;

    // Variables
    let temperatureListenerCreated = false;
    const d = createEventDispatcher();

    // Listener handles
    let unsubTemperatureListener: () => any;

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
    afterUpdate(() => {
        console.log("afterupdate called in temp.svelte");
        ui_temperatureField = document.getElementById("i_temperature") as HTMLInputElement;
    });

    onDestroy(unsubTemperatureListener);

    // Login check
    auth.onAuthStateChanged(user => {
        if (user) {
            // TODO: validate whether the user is an superuser
            // Once login flow is completed, verify that /roles have at least 1 key, and if not, create it
            db.collection("roles").doc(user.uid).get()
            .then((doc) => {
                if (!doc.exists){
                    console.log("user roles for this user does not exist, creating default user role")
                    db.collection("roles").doc(user.uid).set({user: true});
                } else {
                    console.log("User roles: ", doc.data());
                    // Check if user is admin
                    if (doc.data().admin == true) {
                        ui_isAdminUser = true;
                    } else {
                        ui_isAdminUser = false;
                    }
                }
            });
            if (!temperatureListenerCreated) {
                temperatureStatus(user.uid);
                temperatureListenerCreated = true;
            }
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
        // This function checks if the user has already sent using a query listener
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
            window.alert("Your phone seems to be running on the wrong time zone. Please correct your phone's timezone to UTC+8 (Singapore) before submitting your temperature");
            return;
        }

        // Create date range to query
        unsubTemperatureListener = db.collection("temperatures")
        .where("author", "==", uid)
        .where("submitted", "<=", firebase.firestore.Timestamp.fromDate(lowerDateBoundary))
        .where("submitted", ">=", firebase.firestore.Timestamp.fromDate(upperDateBoundary))
        .onSnapshot((querySnapshot) => {
            console.log("Snapshot listener received: ");
            if (querySnapshot.empty) {
                console.log("snapshot is empty");
                ui_temperatureSubmitted = false;
            } else {
                ui_temperatureSubmitted = true;
            }
            querySnapshot.forEach(doc => {
                if (doc.exists) {
                    console.log(doc.id, " => ", doc.data());
                } else {
                    // doc.data() will be undefined in this case
                    console.log("No such document!");
                }
            });
            ui_isVerified = true;
        }, (error) => {
            // TODO: show errors to user
            console.error("Temperature query listener errored out: ", error);
        });
    }
</script>

<div class="container">
    <div class="row">
        <div class="six columns">
            <h5 style="margin-top: 1em; margin-bottom: 0; display: inline-block;">Asclepius Temperature Recording Portal</h5>
        </div>
        <div class="six columns topbar">
            {#if ui_isAdminUser}
                <a class="button button-primary" style="margin-right: 0em;" href="/temp">Take Temperature</a>
                <a class="button" style="margin-right: 0em;" href="/admin">Admin Panel</a>
            {/if}
            <button class="button topbar-loginBtn" on:click={logout}>Log Out</button>
        </div>
    </div>
    <hr class="topbar-hr" />
    {#if !ui_isVerified}
        <!--User is not yet authenticated-->
        <div in:fade class="row">
            <p class="u-full-width" style="margin-top: 1em; text-align: center;">Verifying User...</p>
            <!--put a spinner here-->
        </div>
    {:else}
        <!--User is authenticated-->
        {#if ui_temperatureSubmitted}
            <div in:fade class="row">
                <p class="u-full-width" style="margin-top: 1em; text-align: center;">You have already submitted your temperature. Thank you!</p>
                <button class="button" on:click={() => ui_temperatureSubmitted = false}>Submit Again</button>
            </div>
        {:else}
            <div in:fade class="row">
                <form on:submit|preventDefault={submitTemperature}>
                    <div class="six columns">
                        <label for="i_temperature">Temperature in deg. Celsius (e.g. 36.6)</label>
                        <p style="margin-bottom: 1rem">Please submit your temperature after you have taken it with a personal thermometer</p>
                        <input class="u-full-width" type="number" placeholder="36.6" id="i_temperature" style="margin-bottom: 1em;" step="0.1" max="45" min="30">
                        <input class="button-primary" type="submit" value="Submit Temperature" id="i_login">
                    </div>
                </form>
            </div>
        {/if}
    {/if}
</div>
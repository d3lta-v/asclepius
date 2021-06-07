<script lang="ts">
    // =======================================================================
    // Imports
    import { auth, db } from "../services/firebase";
    import { fade } from "svelte/transition";
    import { createEventDispatcher } from "svelte";
    import { afterUpdate, onMount } from 'svelte';
    import firebase from "firebase/app";

    // =======================================================================
    // Variables and constants

    // UI elements
    let ui_isAdminUser = false;
    let ui_isVerified = false; // whether the user and temperature records are checked already
    let ui_temperatureSubmitted = false;
    let ui_absenceSelected = false;

    // Variables
    let temperatureListenerCreated = false;
    const d = createEventDispatcher();
    let absenceStartString = "";
    let absenceEndString = "";
    let absenceType = "LEV";

    // Listener handles
    let unsubTemperatureListener: () => any;

    // interface User {
    //     phoneNumber: string, author: string
    // }

    interface TemperatureRecord {
        temperature?: number,                               // Temperature of the person (optional)
        submitted: firebase.firestore.Timestamp,            // Submitted timestamp
        phoneNumber: string,                                // Phone number of the person
        author: string,                                     // UID of the person
        absence?: string,                                   // Absence in lieu of temperature record (optional)
        effectiveDates: string[]                            // Array of dates in ISO8601 format (2021-06-30)
    }

    function isTemperatureRecord(obj: any): obj is TemperatureRecord {
        return typeof obj.submitted == 'object'
        && typeof obj.phoneNumber == 'string'
        && typeof obj.author == 'string'
        && Array.isArray(obj.effectiveDates);
    }

    // =======================================================================
    // UI elements
    let ui_temperatureField: HTMLInputElement;

    // =======================================================================
    // Lifecycle

    onMount(() => {
        const todaysDate = generateTodayDateStr();
        absenceStartString = todaysDate;
        absenceEndString = todaysDate;
    });

    afterUpdate(() => {
        console.log("afterupdate called in temp.svelte");
        ui_temperatureField = document.getElementById("i_temperature") as HTMLInputElement;
    });

    // onDestroy(unsubTemperatureListener);

    function generateTodayDateStr() {
        const todaysDate = new Date();
        const year = String(todaysDate.getFullYear());
        const month = String(todaysDate.getMonth()+1).padStart(2, '0');
        const day = String(todaysDate.getDate()).padStart(2, '0');
        const combined = year + "-" + month + "-" + day;
        return combined;
    }

    // Login check
    auth.onAuthStateChanged(user => {
        if (user) {
            // Once login flow is completed, verify that /roles have at least 1 key, and if not, create it
            db.collection("roles").doc(user.uid).get()
            .then((doc) => {
                if (!doc.exists){
                    console.log("user roles for this user does not exist, creating default user role")
                    db.collection("roles").doc(user.uid).set({user: true});
                } else {
                    // Check if user is admin
                    if (doc.data()?.admin == true) {
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
        const temperature = Number(ui_temperatureField.value);
        if (temperature > 50 || temperature < 32 || isNaN(temperature)) {
            window.alert("Invalid temperature! Please key your body temperature in degrees Celcius with decimal points (e.g. 36.5)");
            return;
        }

        // Validate that phoneNumber is correct
        if (typeof user.phoneNumber != 'string') {
            // basic type guarding
            window.alert("Internal error: phone number is undefined");
            return;
        }

        const currentDate = new Date();
        const todayString = String(currentDate.getFullYear())
                            +"-"+String(currentDate.getMonth()+1).padStart(2,'0')
                            +"-"+String(currentDate.getDate()).padStart(2,'0');

        const record: TemperatureRecord = {
            temperature: temperature,
            submitted: firebase.firestore.Timestamp.now(),
            phoneNumber: user.phoneNumber,
            author: user.uid,
            effectiveDates: [todayString]
        }
        db.collection("temperatures").add(record);
    }

    function reportAbsence() {
        // Get user information
        const user = auth.currentUser
        if (!user) {
            console.log("User is null");
            window.location.href = "/";
            return;
        }

        // Validate that phoneNumber is correct
        if (typeof user.phoneNumber != 'string') {
            // basic type guarding
            window.alert("Internal error: phone number is undefined");
            return;
        }

        // Get all the dates from absenceStartString to absenceEndString
        let dates = generateDatesBetween(absenceStartString, absenceEndString);
        // TODO WARNING: this may not account for DST properly!
        let datesStr = dates.map((v)=>v.toISOString().slice(0,10))

        const record: TemperatureRecord = {
            submitted: firebase.firestore.Timestamp.now(),
            phoneNumber: user.phoneNumber,
            author: user.uid,
            absence: absenceType,
            effectiveDates: datesStr
        }
        db.collection("temperatures").add(record);
    }

    function generateDatesBetween(start: string, end: string) {
        for(var arr=[],dt=new Date(start); dt<=new Date(end); dt.setDate(dt.getDate()+1)){
            arr.push(new Date(dt));
        }
        return arr;
    }

    function absDateChanged() {
        console.log(absenceStartString);
        console.log(absenceEndString);
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

        const today = generateTodayDateStr();

        // Create date range to query
        unsubTemperatureListener = db.collection("temperatures")
        .where("author", "==", uid)
        .where("effectiveDates", "array-contains", today)
        .onSnapshot((querySnapshot) => {
            if (querySnapshot.empty) {
                console.log("snapshot is empty");
                ui_temperatureSubmitted = false;
            }
            let currentRecords: TemperatureRecord[] = [];
            querySnapshot.forEach(doc => {
                if (doc.exists && isTemperatureRecord(doc.data())) {
                    if (typeof doc.data().temperature == 'number' || typeof doc.data().absence == 'string') {
                        // temperature record exists
                        currentRecords.push(doc.data() as TemperatureRecord);
                    } else {
                        // invalid data, discard and warn
                        console.warn("Invalid data detected: ", doc.data());
                    }
                } else {
                    // doc.data() will be undefined in this case
                    console.log("Document faulty: ", doc.data());
                }
                if (currentRecords.length === querySnapshot.size) { // End of forEach
                    // managed to get the full snapshot, able to analyze it now
                    // perform pruning to check if today's temperature/absence has been covered
                    // check if there's at least one entry covering absences. if there is, ignore it completely.
                    let absenceExists = false;
                    let temperatureTimeValid = false;
                    for (const record of currentRecords) {
                        if (record.absence) {
                            absenceExists = true;
                        } else {
                            // else, check if any of the entries in question have effectiveTo and effectiveFrom dates
                            const submittedTimestamp = record.submitted.toDate();
                            temperatureTimeValid = submittedTimestamp >= upperDateBoundary && submittedTimestamp <= lowerDateBoundary;
                        }
                    }
                    if (absenceExists || temperatureTimeValid) {
                        ui_temperatureSubmitted = true;
                        console.log("Entry exists");
                    } else {
                        console.log("No entry");
                    }
                } else {
                    console.warn("Currentrecords != querySnapshot. There's problematic data here");
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
        <div class="eight columns">
            <h5 style="margin-top: 1em; margin-bottom: 0; display: inline-block;">Asclepius Temperature Recording Portal</h5>
        </div>
        <div class="four columns topbar">
            {#if ui_isAdminUser}
                <a class="button button-primary" style="margin-right: 0em; font-size: 14px;" href="/temp"><i class="fas fa-thermometer-quarter"></i></a>
                <a class="button" style="margin-right: 0em; font-size: 14px;" href="/admin"><i class="fas fa-columns"></i></a>
            {/if}
            <button type="button" class="button topbar-loginBtn" style="font-size: 14px;" on:click={logout}><i class="fas fa-sign-out-alt"></i></button>
        </div>
    </div>
    <hr class="topbar-hr" />
    {#if !ui_isVerified}
        <!--User is not yet authenticated-->
        <div in:fade class="row">
            <p class="u-full-width" style="margin-top: 1em; text-align: center;">Verifying User...</p>
            <!--put a spinner here-->
            <p style="color: #1EAEDB; font-size: 35px; text-align:center;"><i class="fas fa-spin fa-circle-notch"></i></p>
        </div>
    {:else}
        <!--User is authenticated-->
        {#if ui_temperatureSubmitted}
            <div in:fade class="row">
                <p class="u-full-width" style="margin-top: 1em; text-align: center;">You have already submitted your temperature. Thank you!</p>
                <button type="button" class="button" on:click={() => ui_temperatureSubmitted = false}>Submit Again</button>
            </div>
        {:else if ui_absenceSelected}
            <div in:fade class="row">
                <form on:submit|preventDefault={reportAbsence}>
                    <div class="six columns">
                        <label for="i_absencetype">Type of absence</label>
                        <p style="margin-bottom: 1rem">Please indicate your type of absence</p>
                        <select class="u-full-width" id="i_absencetype" style="margin-bottom: 1rem;" bind:value={absenceType}>
                            <option value="LEV">Leave</option>
                            <option value="OIL">Off in Lieu</option>
                            <option value="MED">Medical Leave (MC/MA)</option>
                            <option value="LOA">Leave of Absence</option>
                            <option value="CRS">On Course outside Workplace</option>
                            <option value="DUY">On Duty</option>
                            <option value="WFH">Working from Home (WFH/HBL)</option>
                            <option value="OTH">Others</option>
                        </select>
                        <div style="display: flex; flex-wrap: wrap; margin-bottom: 2rem; justify-content: space-around;">
                            <div style="order: 1;">
                                <label for="startDate">Start Date:</label>
                                <input type="date" id="startDate" bind:value={absenceStartString} on:change={absDateChanged}>
                            </div>
                            <div style="order: 2;">
                                <label for="endDate">End Date:</label>
                                <input type="date" id="endDate" bind:value={absenceEndString} on:change={absDateChanged}>
                            </div>
                        </div>
                        <button class="button button-primary" type="submit"><i class="fas fa-user-slash"></i> Report absence</button>
                        <button class="button" type="button" on:click={() => {ui_absenceSelected = false}}>Back</button>
                    </div>
                </form>
            </div>
        {:else}
            <div in:fade class="row">
                <form on:submit|preventDefault={submitTemperature}>
                    <div class="six columns">
                        <label for="i_temperature">Temperature in deg. Celsius (e.g. 36.6)</label>
                        <p style="margin-bottom: 1rem">Please submit your temperature after you have taken it with a personal thermometer</p>
                        <input class="u-full-width" type="number" placeholder="36.6" id="i_temperature" style="margin-bottom: 1em;" step="0.1" max="45" min="30">
                        <!-- <input class="button-primary" type="submit" value="Submit Temperature"> -->
                        <button class="button button-primary" type="submit"><i class="fas fa-chevron-circle-up"></i> Submit Temperature</button>
                        <button class="button" type="button" on:click={() => {ui_absenceSelected=true;}}><i class="fas fa-user-slash"></i> Report an absence</button>
                    </div>
                </form>
            </div>
        {/if}
    {/if}
</div>
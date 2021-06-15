<script lang="ts">
    import InfoRow from "./InfoRow.svelte"
    import { auth, db } from "../services/firebase";
    import firebase from "firebase/app";
    import download from "downloadjs";
    import { Parser } from "json2csv";

    let dateSelected = "";
    let adminListenerCreated = false;
    let unsubAdminListener: () => any;

    interface TemperatureRow { // This interface describes the structure of a row of data
        serialNo: number,
        phoneNumber: string,
        authorName: string, // Name of author, based on phone number matching
        amTemperature: number | null,
        amTemperatureID: string | null,
        pmTemperature: number | null,
        pmTemperatureID: string | null,
        editing: boolean,
        newRow: boolean
        id: string | null
    };

    interface TemperatureListener {
        id: string,
        phoneNumber: string,
        listener: () => any
    }

    let temperatureRows: TemperatureRow[] = [];
    let temperatureListeners: TemperatureListener[] = [];

    // Login check
    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection("roles").doc(user.uid).get()
            .then((doc) => {
                if (!doc.exists){
                    console.log("user roles for this user does not exist, creating default user role");
                    db.collection("roles").doc(user.uid).set({user: true});
                } else {
                    // Check if user is admin
                    if (doc.data()?.admin === false) {
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

    function createAdminListener() {
        unsubAdminListener = db.collection("namemap").orderBy("serialNo").onSnapshot((snapshot) => {
            // Pop the last "new row" element
            if (temperatureRows.length > 0) {
                temperatureRows.pop();
            }

            // Perform changes in the data model
            snapshot.docChanges().forEach((change) => {
                // Perform all UI calls here
                if (change.type === "added") {
                    const data = change.doc.data();
                    console.log("Added record with id ", change.doc.id, " and data: ", data);
                    temperatureRows.push({
                        phoneNumber: data.phoneNumber,
                        serialNo: data.serialNo,
                        authorName: data.authorName,
                        amTemperature: null,
                        amTemperatureID: null,
                        pmTemperature: null,
                        pmTemperatureID: null,
                        editing: false,
                        newRow: false,
                        id: change.doc.id
                    });

                    // add listener
                    temperatureListeners.push({
                        id: change.doc.id,
                        phoneNumber: data.phoneNumber,
                        listener: makeListener(change.doc.id, data.phoneNumber)
                    });
                }
                if (change.type === "modified") {
                    const data = change.doc.data();
                    console.log("Modified record with id ", change.doc.id, " and data: ", data);
                    const index = temperatureRows.map(e => e.id).indexOf(change.doc.id);
                    temperatureRows[index] = {
                        phoneNumber: data.phoneNumber,
                        serialNo: data.serialNo,
                        authorName: data.authorName,
                        amTemperature: null,
                        amTemperatureID: null,
                        pmTemperature: null,
                        pmTemperatureID: null,
                        editing: false,
                        newRow: false,
                        id: change.doc.id
                    };
                    // destroy and recreate listeners
                    const indexListener = temperatureListeners.map(e => e.id).indexOf(change.doc.id);
                    temperatureListeners[indexListener].listener();
                    temperatureListeners[indexListener].listener = makeListener(change.doc.id, data.phoneNumber, dateSelected);
                }
                if (change.type === "removed") {
                    console.log("Removed record: ", change.doc.data());
                    const indexRow = temperatureRows.map(e => e.id).indexOf(change.doc.id);
                    const indexListener = temperatureListeners.map(e => e.id).indexOf(change.doc.id);
                    temperatureListeners[indexListener].listener(); // destroy the listener
                    temperatureListeners.splice(indexListener, indexListener);
                    temperatureRows.splice(indexRow,indexRow);

                    // TODO: There's a bug concerning the removal of the last element in the array
                }
                temperatureRows = temperatureRows;
            });

            // Add the New row for users to add phone numbers
            temperatureRows.push({
                phoneNumber: "",
                serialNo: temperatureRows.length+1,
                authorName: "",
                amTemperature: null,
                amTemperatureID: null,
                pmTemperature: null,
                pmTemperatureID: null,
                editing: false,
                newRow: true,
                id: null
            });

            // Sort by serial number
            temperatureRows.sort(function(a, b){return a.serialNo-b.serialNo});
        });
        // Add the New row for users to add phone numbers
        temperatureRows.push({
            phoneNumber: "",
            serialNo: temperatureRows.length+1,
            authorName: "",
            amTemperature: null,
            amTemperatureID: null,
            pmTemperature: null,
            pmTemperatureID: null,
            editing: false,
            newRow: true,
            id: null
        });
        temperatureRows = temperatureRows;
    }

    function isPM(timestamp: firebase.firestore.Timestamp) {
        const timeAsDate = timestamp.toDate();
        //TODO: does this properly take into account timezones?
        return timeAsDate.getHours() >= 12;
    }

    function dateSelecterChanged() {
        console.log("Date selecter changed: ", dateSelected);

        for (const iterator of temperatureListeners) {
            // Deregister each listener
            iterator.listener();
            // Re-register them with the new date
            // don't use push, just modify the existing one
            iterator.listener = makeListener(iterator.id, iterator.phoneNumber, dateSelected);
        }
    }

    function makeListener(id: string, phoneNumber: string, dateString?: string) {
        const upperDateBoundary = new Date();
        const lowerDateBoundary = new Date();

        if (dateString) {
            upperDateBoundary.setFullYear(Number(dateString.substring(0,4)), Number(dateString.substring(5,7))-1, Number(dateString.substring(8,10)));
            lowerDateBoundary.setFullYear(Number(dateString.substring(0,4)), Number(dateString.substring(5,7))-1, Number(dateString.substring(8,10)));
        }

        upperDateBoundary.setHours(0,0,0,0);
        lowerDateBoundary.setHours(23,59,59,0);

        return db.collection("temperatures")
            .where("phoneNumber", "==", phoneNumber)
            .where("submitted", "<=", firebase.firestore.Timestamp.fromDate(lowerDateBoundary))
            .where("submitted", ">=", firebase.firestore.Timestamp.fromDate(upperDateBoundary))
            .onSnapshot((querySnapshot) => {
                console.log("Snapshot listener created for phoneNumber: ", phoneNumber);
                if (querySnapshot.empty) {
                    console.log("snapshot is empty");
                }
                let iterations = 0;
                const phoneNumberMatching = (element: TemperatureRow) => element.phoneNumber === phoneNumber;
                const tempIndex = temperatureRows.findIndex(phoneNumberMatching);

                querySnapshot.forEach(doc => {
                    if (doc.exists) {
                        iterations++;
                        console.log(doc.id, " => ", doc.data());
                        // Automatically change the temperature by finding it first
                        
                        const timestamp: firebase.firestore.Timestamp = doc.data().submitted;
                        
                        if (isPM(timestamp)) {
                            temperatureRows[tempIndex].pmTemperature = doc.data().temperature;
                            temperatureRows[tempIndex].pmTemperatureID = doc.id;
                        } else {
                            temperatureRows[tempIndex].amTemperature = doc.data().temperature;
                            temperatureRows[tempIndex].amTemperatureID = doc.id;
                        }
                    } else {
                        // doc.data() will be undefined in this case
                        console.log("No such document!");
                    }
                });

                // If there's no temperature records within this query
                if (iterations < 1) {
                    temperatureRows[tempIndex].pmTemperature = null;
                    temperatureRows[tempIndex].pmTemperatureID = null;
                    temperatureRows[tempIndex].amTemperature = null;
                    temperatureRows[tempIndex].amTemperatureID = null;
                }
            }, (error) => {
                // TODO: show errors to user
                console.error("Temperature query listener errored out: ", error);
            })
    }

    function exportToday() {
        // transform ordinary temperaturerows into a well-defined JSON object
        let csvobject = [];
        for (const iterator of temperatureRows) {
            if (!iterator.newRow) { // do not push newRow objects
                csvobject.push({
                    "S/N": iterator.serialNo,
                    "Phone Number": iterator.phoneNumber,
                    "Name": iterator.authorName,
                    "AM Temperature": iterator.amTemperature,
                    "PM Temperature": iterator.pmTemperature
                });
            }
        }

        // turn JSON object into CSV
        download(new Blob([new Parser().parse(csvobject)]),"test.csv","text/csv");
    }

</script>

<div class="row">
    <!--This row acts as a contextual bar, which changes based on 
        what's selected on the function selection bar-->
    <form style="display: inline-block; margin-right: 1em;">
        <label for="dateSelector" style="display: inline-block;">Date Selection:</label>
        <input type="date" id="dateSelector" bind:value={dateSelected} on:change={dateSelecterChanged}>
    </form>
    <button type="button" class="button u-pull-right" on:click={exportToday}>Export Today (.csv)</button>
</div>
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
            {#if temperatureRows.length > 0}
                {#each temperatureRows as temp}
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
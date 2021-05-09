<script lang="ts">
    // export let message: string;
    import { onDestroy, beforeUpdate, afterUpdate } from 'svelte';
    import { db } from "../services/firebase";
    import { fade } from "svelte/transition";
    import firebase from "firebase/app";

    export let serialNo = 0;
    export let phoneNo = "";
    export let authorName = "";
    export let amTemperature = 0;
    export let pmTemperature = 0;
    export let id = "";

    export let editing = false; // true means that the row is under editing mode
    export let newRow = false;

    let amListener: () => any | null;

    beforeUpdate(() => {
        console.log("before update inforow with s/n ", serialNo, ", id: ", id);
        if (amListener) {
            console.log("Destroying AM listener...");
            amListener();
        } else {
            console.log("AM listener is null");
        }
    });

    afterUpdate(() => {
        // NOTE TODO: THIS IS NOT WORKING
        console.log("after update inforow with s/n ", serialNo, ", id: ", id);
        // Insert listeners at this point
        const upperDateBoundary = new Date();
        const lowerDateBoundary = new Date();

        // upperDateBoundary.setHours(0,0,0,0);
        // lowerDateBoundary.setHours(12,0,0,0);

        upperDateBoundary.setHours(12,0,0,1);
        lowerDateBoundary.setHours(23,59,59,0);

        // Destroy listener if it exists
        if (amListener) {
            amListener();
        }

        console.log("Phone number: ", phoneNo);
        amListener = db.collection("temperatures")
        .where("phoneNo", "==", phoneNo)
        .where("submitted", "<=", firebase.firestore.Timestamp.fromDate(lowerDateBoundary))
        .where("submitted", ">=", firebase.firestore.Timestamp.fromDate(upperDateBoundary))
        .onSnapshot((querySnapshot) => {
            console.log("Snapshot listener received: ");
            if (querySnapshot.empty) {
                console.log("snapshot is empty");
            }
            querySnapshot.forEach(doc => {
                if (doc.exists) {
                    console.log(doc.id, " => ", doc.data());
                } else {
                    // doc.data() will be undefined in this case
                    console.log("No such document!");
                }
            });
        }, (error) => {
            // TODO: show errors to user
            console.error("Temperature query listener errored out: ", error);
        });

        // TODO: pm listener here
    });

    onDestroy(() => {
        // destroy all listeners
        if (amListener) {
            amListener();
        }
    });

    function shiftUp() {
        // This function will shift the row upwards
        serialNo--;
        db.collection("namemap").doc(id).update({ serialNo }).then(() => {
            console.log("Document successfully shifted up");
        }).catch((error) => {
            console.error("Error shifting document: ", error);
        });
    }

    function shiftDown() {
        // This function will shift the row downwards
        serialNo++;
        db.collection("namemap").doc(id).update({ serialNo }).then(() => {
            console.log("Document successfully shifted down");
        }).catch((error) => {
            console.error("Error shifting document: ", error);
        });
    }

    function add() {
        // This function adds the row to the mapping
        let obj = {
            authorName,
            phoneNo,
            serialNo
        };
        db.collection("namemap").add(obj).then(() => {
            console.log("Document successfully added");
        }).catch((error) => {
            console.error("Error adding document: ", error);
        });
        // Complete the add process
    }

    function delet() {
        // This function will delete the row
        db.collection("namemap").doc(id).delete().then(() => {
            console.log("Document successfully deleted");
        }).catch((error) => {
            console.error("Error removing document: ", error);
        });
    }

    function editDone() {
        editing = false;
        db.collection("namemap").doc(id).update({ 
            phoneNo,
            authorName
        }).then(() => {
            console.log("Document successfully edited");
        }).catch((error) => {
            console.error("Error editing document: ", error);
        });
    }
</script>

<tr in:fade>
    {#if newRow}
        <!--New Row-->
        <td class="centred-td">{serialNo}</td>
        <td><input type="tel" placeholder="+6591234567" bind:value={phoneNo}></td>
        <td><input type="text" placeholder="New Name Here" bind:value={authorName}></td>
        <td>N/A</td>
        <td>N/A</td>
        <td>
            <button class="compactBtn" on:click={add}>Add</button>
        </td>
    {:else}
        <!--Data already exists-->
        {#if editing}
            <td class="centred-td">{serialNo}</td>
            <td><input type="tel" placeholder="+6591234567" bind:value={phoneNo}></td>
            <td><input type="text" placeholder="Name" bind:value={authorName}></td>
            <td><input class="number-field" type="number" placeholder="AM Temp" bind:value={amTemperature} step="0.1" max="45" min="30"></td>
            <td><input class="number-field" type="number" placeholder="PM Temp" bind:value={pmTemperature} step="0.1" max="45" min="30"></td>
            <td>
                <button class="compactBtn" on:click={editDone}>Done</button>
                <button class="compactBtn" on:click={shiftUp}>⬆️</button>
                <button class="compactBtn" on:click={shiftDown}>⬇️</button>
                <button class="compactBtn" on:click={delet}>🗑️</button>
            </td>
        {:else}
            <td class="centred-td">{serialNo}</td>
            <td>{phoneNo}</td>
            <td>{authorName}</td>
            <td>{amTemperature}</td>
            <td>{pmTemperature}</td>
            <td>
                <button class="compactBtn" on:click={() => editing = true}>Edit</button>
                <button class="compactBtn" on:click={shiftUp}>⬆️</button>
                <button class="compactBtn" on:click={shiftDown}>⬇️</button>
                <button class="compactBtn" on:click={delet}>🗑️</button>
            </td>
        {/if}
    {/if}
</tr>
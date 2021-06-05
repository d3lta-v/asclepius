<script lang="ts">
    // export let message: string;
    import { db } from "../services/firebase";
    import { fade } from "svelte/transition";

    export let serialNo = 0;
    export let phoneNumber = "";
    export let authorName = "";
    export let amTemperature: number | null = 0;
    export let amTemperatureID: string | null = "";
    export let pmTemperature: number | null = 0;
    export let pmTemperatureID: string | null = "";
    export let id: string | null = "";

    export let editing = false; // true means that the row is under editing mode
    export let newRow = false;

    function shiftUp() {
        // This function will shift the row upwards
        serialNo--;
        if (typeof id != 'string') {
            console.warn("User tried to shift up a nonexistent ID!");
            return; // TODO: maybe warn the user?
        }
        db.collection("namemap").doc(id).update({ serialNo }).then(() => {
            console.log("Document successfully shifted up");
        }).catch((error) => {
            console.error("Error shifting document: ", error);
        });
    }

    function shiftDown() {
        // This function will shift the row downwards
        serialNo++;
        if (typeof id != 'string') {
            console.warn("User tried to shift down a nonexistent ID!");
            return;
        }
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
            phoneNumber: phoneNumber,
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
        if (typeof id != 'string') {
            console.warn("User tried to delete down a nonexistent ID!");
            return;
        }
        db.collection("namemap").doc(id).delete().then(() => {
            console.log("Document successfully deleted");
        }).catch((error) => {
            console.error("Error removing document: ", error);
        });
    }

    function editDone() {
        editing = false;
        if (typeof id != 'string') {
            console.warn("User tried to edit a nonexistent ID!");
            return;
        }
        db.collection("namemap").doc(id).update({ 
            phoneNumber,
            authorName
        }).then(() => {
            console.log("Document successfully edited");
        }).catch((error) => {
            console.error("Error editing document: ", error);
        });
        // update temperature next, need to find the date
        console.log("AM Temperature ID", amTemperatureID);
        console.log("PM Temperature ID", pmTemperatureID);
    }
</script>

<tr in:fade>
    {#if newRow}
        <!--New Row-->
        <td class="centred-td">{serialNo}</td>
        <td><input type="tel" placeholder="+6591234567" bind:value={phoneNumber}></td>
        <td><input type="text" placeholder="New Name Here" bind:value={authorName}></td>
        <td>N/A</td>
        <td>N/A</td>
        <td>
            <button class="compactBtn" type="button" on:click={add}>Add</button>
        </td>
    {:else}
        <!--Data already exists-->
        {#if editing}
            <td class="centred-td">{serialNo}</td>
            <td><input type="tel" placeholder="+6591234567" bind:value={phoneNumber}></td>
            <td><input type="text" placeholder="Name" bind:value={authorName}></td>
            <td><input class="number-field" type="number" placeholder="AM Temp" bind:value={amTemperature} step="0.1" max="45" min="30"></td>
            <td><input class="number-field" type="number" placeholder="PM Temp" bind:value={pmTemperature} step="0.1" max="45" min="30"></td>
            <td>
                <button class="compactBtn" type="button" on:click={editDone}>Done</button>
                <button class="compactBtn" type="button" on:click={shiftUp}>⬆️</button>
                <button class="compactBtn" type="button" on:click={shiftDown}>⬇️</button>
                <button class="compactBtn" type="button" on:click={delet}>🗑️</button>
            </td>
        {:else}
            <td class="centred-td">{serialNo}</td>
            <td style="color: {(amTemperature ?? 0) >= 37.5 || (pmTemperature ?? 0) >= 37.5 ? 'red' : 'black'}; font-weight: {(amTemperature ?? 0) >= 37.5 || (pmTemperature ?? 0) >= 37.5 ? '700' : '400'}">
                {phoneNumber}
            </td>
            <td style="color: {(amTemperature ?? 0) >= 37.5 || (pmTemperature ?? 0) >= 37.5 ? 'red' : 'black'}; font-weight: {(amTemperature ?? 0) >= 37.5 || (pmTemperature ?? 0) >= 37.5 ? '700' : '400'}">
                {authorName}
            </td>
            <td style="color: {(amTemperature ?? 0) >= 37.5 ? 'red' : 'black'}; font-weight: {(amTemperature ?? 0) >= 37.5 ? '700' : '400'}">
                {amTemperature}
            </td>
            <td style="color: {(pmTemperature ?? 0) >= 37.5 ? 'red' : 'black'}; font-weight: {(pmTemperature ?? 0) >= 37.5 ? '700' : '400'}">
                {pmTemperature}
            </td>
            <td>
                <button class="compactBtn" type="button" on:click={() => editing = true}>Edit</button>
                <button class="compactBtn" type="button" on:click={shiftUp}>⬆️</button>
                <button class="compactBtn" type="button" on:click={shiftDown}>⬇️</button>
                <button class="compactBtn" type="button" on:click={delet}>🗑️</button>
            </td>
        {/if}
    {/if}
</tr>
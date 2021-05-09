<script lang="ts">
    // export let message: string;
    import { afterUpdate } from 'svelte';
    import { auth, db } from "../services/firebase";
    import { fade } from "svelte/transition";

    export let serialNo = 0;
    export let phoneNo = "";
    export let authorName = "";
    export let amTemperature = 0;
    export let pmTemperature = 0;
    export let id = "";

    export let editing = false; // true means that the row is under editing mode
    export let newRow = false;

    function shiftUp() {
        // This function will shift the row upwards
    }

    function shiftDown() {
        // This function will shift the row downwards
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
                <button class="compactBtn" on:click={() => editing = false}>Done</button>
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
<script lang="ts">
    // export let message: string;
    interface TemperatureRow {
        serialNo: number,
        phoneNo: string,
        authorName: string, // Name of author, based on phone number matching
        amTemperature: number,
        pmTemperature: number
    }

    let row: TemperatureRow = {
        serialNo: 1,
        phoneNo: "91234567",
        authorName: "Testing",
        amTemperature: 36.6,
        pmTemperature: 36.5
    }

    let editing = false; // true means that the row is under editing mode
    let newRow = false;

    function shiftUp() {
        // This function will shift the row upwards
    }

    function shiftDown() {
        // This function will shift the row downwards
    }

    function add() {
        // This function adds the row to the rest
    }

    function delet() {
        // This function will delete the row
    }
</script>

<tr>
    {#if newRow}
        <!--New Row-->
        <td class="centred-td">N/A</td>
        <td><input type="tel" placeholder="91234567" bind:value={row.phoneNo}></td>
        <td><input type="text" placeholder="New Name Here" bind:value={row.authorName}></td>
        <td>N/A</td>
        <td>N/A</td>
        <td>
            <button class="compactBtn" on:click={add}>Add</button>
        </td>
    {:else}
        <!--Data already exists-->
        {#if editing}
            <td class="centred-td">{row.serialNo}</td>
            <td><input type="tel" placeholder="91234567" bind:value={row.phoneNo}></td>
            <td><input type="text" placeholder="Name" bind:value={row.authorName}></td>
            <td><input class="number-field" type="number" placeholder="AM Temp" bind:value={row.amTemperature} step="0.1" max="45" min="30"></td>
            <td><input class="number-field" type="number" placeholder="PM Temp" bind:value={row.pmTemperature} step="0.1" max="45" min="30"></td>
            <td>
                <button class="compactBtn" on:click={() => editing = false}>Done</button>
                <button class="compactBtn" on:click={shiftUp}>⬆️</button>
                <button class="compactBtn" on:click={shiftDown}>⬇️</button>
                <button class="compactBtn" on:click={delet}>🗑️</button>
            </td>
        {:else}
            <td class="centred-td">{row.serialNo}</td>
            <td>{row.phoneNo}</td>
            <td>{row.authorName}</td>
            <td>{row.amTemperature}</td>
            <td>{row.pmTemperature}</td>
            <td>
                <button class="compactBtn" on:click={() => editing = true}>Edit</button>
                <button class="compactBtn" on:click={shiftUp}>⬆️</button>
                <button class="compactBtn" on:click={shiftDown}>⬇️</button>
                <button class="compactBtn" on:click={delet}>🗑️</button>
            </td>
        {/if}
    {/if}
</tr>
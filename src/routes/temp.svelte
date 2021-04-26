<script lang="ts">
    // import Auth from "../components/Auth.svelte";
    import {fade} from "svelte/transition"
</script>

<div class="container">
    <div class="row">
        <h5 style="margin-top: 1em;">Asclepius Temperature Recording Portal</h5>
    </div>
    <div class="row">
        <p>You have not yet submitted your AM temperature yet.</p>
    </div>
    <div class="row">
        <form in:fade>
            <div class="row">
                <div class="five columns">
                    <label for="i_phoneNo">Submit your temperature below (e.g. 36.6) in degrees Celsius</label>
                    <input class="u-full-width" type="number" placeholder="36.6" id="i_temperature" style="margin-bottom: 1em;">
                    <input class="button-primary" type="submit" value="Submit Temperature" min="30" max="50" id="i_login">
                </div>
            </div>
        </form>
    </div>
</div>
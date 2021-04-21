<script lang="ts">
    import {fade} from "svelte/transition"
    import ErrorAlert from "./ErrorAlert.svelte";

    // export let authMode: "login" | "register" = "register";
    let isAuthenticated = false;
    let err: string | null = null;

    function login() {
        console.log("logging in...")
    }

    // function register() {}

    function logout() {
        console.log("Logging out...")
    }

    // function google() {}
</script>

<div class="container">
    {#if !isAuthenticated}
    <h3>Log In</h3>
    {#if err}
    <ErrorAlert message={err} />
    {/if}
    <form in:fade on:submit|preventDefault={login}>
        <div class="row">
            <label for="phoneNo">Phone Number</label>
            <input class="u-full-width" type="email" placeholder="91234567" id="phoneNo">
        </div>
        <div class="row">
            <input class="button-primary" type="submit" value="Login">
        </div>
    </form>
    {:else}
    <h2>Logged In</h2>
    <div class="row">
        <button class="button-primary" type="button" value="Logout" on:click={logout}>
    </div>
    {/if}
</div>
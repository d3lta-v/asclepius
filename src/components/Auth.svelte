<script lang="ts">
    import {fade} from "svelte/transition"
    // import ErrorAlert from "./ErrorAlert.svelte";

    // export let authMode: "login" | "register" = "register";
    let isAuthenticated = false;
    let err: string | null = null;

    function login() {}

    function register() {}

    function logout() {}

    function google() {}
</script>

<div class="container">
    {#if !isAuthenticated}
    <div class="row">
        <h3>Log In</h3>
        <form>
            <div class="row">
                <label for="exampleEmailInput">Email</label>
                <input class="u-full-width" type="email" placeholder="test@mailbox.com" id="emailInput">
            </div>
            <div class="row">
                <label for="exampleEmailInput">Password</label>
                <input class="u-full-width" type="password" placeholder="*********" id="passwordInput">
            </div>
            <div class="row">
                <input class="button-primary" type="button" value="Submit">
                <input class="button" type="button" value="Register">
            </div>
          </form>
    </div>
    {/if}
</div>
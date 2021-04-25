<script lang="ts">
    // import Auth from "../components/Auth.svelte";
    let isAdminUser = true;
    let isAuthenticated = false;

    // Don't forget to add logic that kicks people out if there're not logged in
    import {auth} from "../services/firebase";

    // Login check
    auth.onAuthStateChanged(user => {
        isAuthenticated = !!user;
        if (user) {
            console.log("Current user phone no.: ", user.phoneNumber);
            // TODO: validate whether the user is an superuser
        } else {
            console.log("User is null");
            // TODO: kick the user out
        }
    })
</script>

<div class="container">
    <div class="row">
        <div class="seven columns">
            <h5 style="margin-top: 1em; margin-right: 1em; display: inline-block;">Asclepius Temperature Recording Portal</h5>
        </div>
        {#if isAdminUser}
        <div class="five columns" style="padding-top: 2em;">
            <a class="button" style="margin-right: 1em;" href="/temp">Take Temperature</a>
            <a class="button button-primary" href="/admin">Admin Panel</a>
        </div>
        {/if}
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
                <tr>
                    <td class="centred-td">1</td>
                    <td>91478066</td>
                    <td>Pan Ziyue</td>
                    <td>36.5</td>
                    <td>36.6</td>
                    <td>
                        <button class="compactBtn">Edit</button>
                        <button class="compactBtn">⬆️</button>
                        <button class="compactBtn">⬇️</button>
                        <button class="compactBtn">🗑️</button>
                    </td>
                </tr>
                <tr>
                    <td class="centred-td">2</td>
                    <td><input type="tel" placeholder="91234567" value="70000000"></td>
                    <td><input type="text" placeholder="Name" value="John Smith"></td>
                    <td><input class="number-field" type="number" placeholder="AM Temp" value="36.5" step="0.1" max="45" min="30"></td>
                    <td><input class="number-field" type="number" placeholder="PM Temp" value="36.5" step="0.1" max="45" min="30"></td>
                    <td>
                        <button class="compactBtn">Done</button>
                        <button class="compactBtn">⬆️</button>
                        <button class="compactBtn">⬇️</button>
                        <button class="compactBtn">🗑️</button>
                    </td>
                </tr>
                <tr>
                    <td class="centred-td">N/A</td>
                    <td><input type="tel" placeholder="91234567"></td>
                    <td><input type="text" placeholder="New Name Here"></td>
                    <td>N/A</td>
                    <td>N/A</td>
                    <td>
                        <button class="compactBtn">Add</button>
                    </td>
                </tr>
            </tbody>
          </table>
    </div>
</div>

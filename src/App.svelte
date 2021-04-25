<script lang="ts">
    import router from "page";
    import Index from "./routes/index.svelte";
    import NotFound from "./routes/notfound.svelte";
    import Temp from "./routes/temp.svelte";
    import Admin from "./routes/admin.svelte";

    // Variables
    let page: any;
    let params = {};
    let qs = {};

    // Routes   
    router("/", () => page = Index);
    router("/404/:msg", (ctx: {params: {}, querystring: string}, next) => {
        params = ctx.params;
        next();
    }, () => page = NotFound);
    router("/temp", () => page = Temp);
    router("/admin", () => page = Admin);
    router("/*", () => page = NotFound);

    router.start();
</script>

<svelte:component this={page} {params} {qs} />
<script lang="ts">
    import router from "page";
    import Index from "./routes/index.svelte";
    import NotFound from "./routes/notfound.svelte";
    import Temp from "./routes/temp.svelte";

    // Variables
    let page;
    let params = {};
    let qs = {};

    // Routes   
    router("/", () => page = Index);
    router("/404/:msg", (ctx: {params: {}, querystring: string}, next) => {
        params = ctx.params;
        next();
    }, () => page = NotFound);
    router("/temp", () => page = Temp);
    router("/*", () => page = NotFound);

    router.start();
</script>

<svelte:component this={page} {params} {qs} />
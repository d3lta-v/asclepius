<script lang="ts">
    import router from "page";
    import Index from "./routes/index.svelte";

    let page;
    let params = {};

    router("/", () => page = Index)

    router.start();
</script>

<svelte:component this={page} {params} />
<script>
	import { browser } from "$app/environment";
	import "../app.css";
</script>

{#if browser}
	<slot />
{/if}

<script lang="ts">
	import type { ActiveTab } from "$lib/types";

	interface Props {
		type: ActiveTab;
		isActive: boolean;
		onclick: () => void;
	}

	let { type, isActive, onclick }: Props = $props();

	const buttonColor = $derived(
		type === "lock" ? "bg-orange-500" : "bg-teal-500"
	);

	const label = $derived(type === "lock" ? "Lock" : "Withdraw");
</script>

<button
	{onclick}
	class={`flex-1 py-3 px-4 rounded-md transition-colors font-medium ${
		isActive ? `${buttonColor} text-white` : "text-gray-400 hover:text-white"
	}`}
>
	{label}
</button>

<script lang="ts">
	import type { WalletState } from "$lib/types";
	import { formatAmount, truncateAddress } from "$lib/utils";

	interface Props {
		walletState: WalletState;
		lockedAmount: number;
		onConnect: () => Promise<void>;
		onDisconnect: () => void;
	}

	let { walletState, lockedAmount, onConnect, onDisconnect }: Props = $props();

	async function handleConnect() {
		try {
			await onConnect();
		} catch (error) {
			console.error("Connection failed:", error);
		}
	}
</script>

<div class="flex justify-between items-center mb-8">
	<div>
		<p class="text-gray-400 text-sm">Locked Amount:</p>
		<p class="text-2xl font-bold">
			({formatAmount(lockedAmount, 2)} STX)
		</p>
	</div>

	{#if walletState.isConnecting}
		<button
			class="px-6 py-3 rounded-xl border border-blue-500 bg-blue-500/10 text-blue-400"
		>
			<div class="flex items-center">
				<div
					class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"
				></div>
				Connecting...
			</div>
		</button>
	{:else if walletState.isConnected}
		<div class="text-right">
			<div class="text-sm text-gray-400">
				Balance: {formatAmount(walletState.balance, 2)} STX
			</div>
			<div class="text-sm text-green-400">
				{truncateAddress(walletState.address)}
			</div>
			<button
				onclick={onDisconnect}
				class="mt-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
			>
				Disconnect
			</button>
		</div>
	{:else}
		<button
			onclick={handleConnect}
			class="px-6 py-3 rounded-xl border border-gray-600 hover:border-gray-500 transition-colors"
		>
			Connect Wallet
		</button>
	{/if}
</div>

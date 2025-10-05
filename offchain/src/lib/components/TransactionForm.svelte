<script lang="ts">
	import type { WalletState, ActiveTab } from "$lib/types";
	import { validateAmount, formatAmount } from "$lib/utils";
	import TabButton from "./TabButton.svelte";

	interface Props {
		walletState: WalletState;
		lockedAmount: number;
		isLoading: boolean;
		onLockFunds: (amount: number) => Promise<void>;
		onWithdrawFunds: (amount: number) => Promise<void>;
	}

	let {
		walletState,
		lockedAmount,
		isLoading,
		onLockFunds,
		onWithdrawFunds,
	}: Props = $props();

	let activeTab = $state<ActiveTab>("lock");
	let amount = $state("");

	let maxAmount = $derived(
		activeTab === "lock" ? walletState.balance : lockedAmount
	);
	let validation = $derived(validateAmount(amount, maxAmount, activeTab));

	let isFormDisabled = $derived(
		!walletState.isConnected || isLoading || !validation.isValid || !amount
	);

	async function handleSubmit() {
		if (isFormDisabled) return;

		try {
			const amountValue = parseFloat(amount);

			if (activeTab === "lock") {
				await onLockFunds(amountValue);
			} else {
				await onWithdrawFunds(amountValue);
			}

			amount = "";
		} catch (error) {
			console.error(`${activeTab} transaction error:`, error);
			alert(
				`Error: ${error instanceof Error ? error.message : "Transaction failed"}`
			);
		}
	}

	function getButtonColor() {
		if (isFormDisabled) {
			return "bg-gray-800 text-gray-500 border-gray-600";
		}
		return activeTab === "lock"
			? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
			: "bg-teal-500 hover:bg-teal-600 text-white border-teal-500";
	}
</script>

<div class="bg-gray-800 rounded-2xl p-6 mb-8 border border-gray-700">
	<!-- Tabs -->
	<div class="flex mb-6 bg-gray-900 rounded-lg p-1">
		<TabButton
			type="lock"
			isActive={activeTab === "lock"}
			onclick={() => (activeTab = "lock")}
		/>
		<div class="w-px bg-gray-600 my-2"></div>
		<TabButton
			type="withdraw"
			isActive={activeTab === "withdraw"}
			onclick={() => (activeTab = "withdraw")}
		/>
	</div>

	<!-- Form -->
	<div>
		<div class="mb-6">
			<div class="block text-gray-300 mb-3 font-medium">Amount (STX)</div>
			<input
				type="number"
				bind:value={amount}
				class="w-full px-4 py-4 bg-gray-900 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-gray-400 focus:outline-none transition-colors"
				placeholder="Enter amount in STX..."
				step="0.000001"
				min="0"
				max={maxAmount}
				disabled={!walletState.isConnected}
			/>

			<!-- Balance Info -->
			<div class="flex justify-between items-center mt-2">
				<p class="text-xs text-gray-500">
					{activeTab === "withdraw"
						? `Available to withdraw: ${formatAmount(lockedAmount, 6)} STX`
						: `Wallet balance: ${formatAmount(walletState.balance, 6)} STX`}
				</p>
				{#if validation.error}
					<p class="text-xs text-red-400">{validation.error}</p>
				{/if}
			</div>
		</div>

		<button
			onclick={handleSubmit}
			disabled={isFormDisabled}
			class={`w-full py-4 font-medium rounded-xl transition-colors border flex items-center justify-center ${getButtonColor()}`}
		>
			{#if isLoading}
				<div
					class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
				></div>
				Processing...
			{:else}
				Submit
			{/if}
		</button>
	</div>
</div>

<script lang="ts">
	import { onMount } from "svelte";
	import { walletStore } from "$lib/stores/wallet.svelte";
	import { transactionStore } from "$lib/stores/transactions.svelte";

	import { websocketStore } from "$lib/stores/websocket.svelte";
	import WalletHeader from "$lib/components/WalletHeader.svelte";
	import TransactionForm from "$lib/components/TransactionForm.svelte";
	import TransactionList from "$lib/components/TransactionList.svelte";
	import ContractInfo from "$lib/components/ContractInfo.svelte";
	import { stxToMicroStx } from "$lib/utils";

	onMount(() => {
		const init = async () => {
			const wsClient = await websocketStore.connect();
			if (wsClient) {
				transactionStore.setWsClient(wsClient);
				walletStore.setWsClient(wsClient);
			}
		};

		init();

		return () => {
			transactionStore.cleanup();
		};
	});

	$effect(() => {
		if (!walletStore.walletState.isConnected) {
			transactionStore.clearTransactions();
		}
	});

	$effect(() => {
		if (walletStore.walletState.isConnected) {
			transactionStore.loadTransactions(walletStore.walletState.address);
		}
	});

	async function handleLockFunds(amount: number) {
		transactionStore.isLoading = true;
		try {
			const txId = await walletStore.lockFunds(amount);
			transactionStore.addAndTrackTransaction(txId, {
				type: "lock",
				amount: stxToMicroStx(amount).toString(),
				txStatus: "pending",
			});
		} finally {
			transactionStore.isLoading = false;
		}
	}

	async function handleWithdrawFunds(amount: number) {
		transactionStore.isLoading = true;
		try {
			// Validate locked amount before withdrawing
			if (amount > transactionStore.lockedAmount) {
				throw new Error("Insufficient locked balance");
			}

			const txId = await walletStore.withdrawFunds(amount);
			transactionStore.addAndTrackTransaction(txId, {
				type: "withdraw",
				amount: stxToMicroStx(amount).toString(),
				txStatus: "pending",
			});
		} finally {
			transactionStore.isLoading = false;
		}
	}
</script>

<div class="min-h-screen bg-black text-white p-6">
	<div
		class="max-w-2xl mx-auto bg-gray-900 rounded-3xl p-8 border border-gray-700"
	>
		<WalletHeader
			walletState={walletStore.walletState}
			lockedAmount={transactionStore.lockedAmount}
			onConnect={() => walletStore.connectWallet()}
			onDisconnect={() => walletStore.disconnectWallet()}
		/>

		<TransactionForm
			walletState={walletStore.walletState}
			lockedAmount={transactionStore.lockedAmount}
			isLoading={transactionStore.isLoading}
			onLockFunds={handleLockFunds}
			onWithdrawFunds={handleWithdrawFunds}
		/>

		<ContractInfo
			contractConfig={walletStore.contractConfig}
			walletState={walletStore.walletState}
		/>

		<TransactionList
			transactions={transactionStore.transactions}
			walletState={walletStore.walletState}
		/>
	</div>
</div>

<script lang="ts">
	import type { ITransaction, WalletState } from "$lib/types";
	import { microStxToStx, truncateHash } from "$lib/utils";

	import { format } from "date-fns";

	interface Props {
		transactions: ITransaction[];
		walletState: WalletState;
	}

	let { transactions, walletState }: Props = $props();

	function getStatusColor(status: ITransaction["txStatus"]) {
		switch (status) {
			case "success":
				return "bg-green-500/20 text-green-400";
			case "pending":
				return "bg-yellow-500/20 text-yellow-400";
			case "failed":
				return "bg-red-500/20 text-red-400";
			default:
				return "bg-gray-500/20 text-gray-400";
		}
	}

	function getAmountColor(type: ITransaction["type"]) {
		return type === "lock" ? "text-green-400" : "text-red-400";
	}

	function getAmountPrefix(type: ITransaction["type"]) {
		return type === "lock" ? "+" : "-";
	}
</script>

<div>
	<h3 class="text-xl font-bold mb-4 flex items-center">
		Transactions (Live)
		<span class="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
	</h3>

	<div class="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
		<!-- Table Header -->
		<div class="flex bg-gray-900 px-6 py-4 border-b border-gray-700">
			<div class="flex-1 text-gray-400 font-medium">TxHash</div>
			<div class="w-20 text-center text-gray-400 font-medium">Status</div>
			<div class="w-24 text-center text-gray-400 font-medium">Amount</div>
		</div>

		<!-- Table Body -->
		<div class="max-h-64 overflow-y-auto">
			{#if transactions.length === 0}
				<div class="px-6 py-8 text-center text-gray-500">
					{walletState.isConnected
						? "No transactions yet"
						: "Connect wallet to view transactions"}
				</div>
			{:else}
				{#each transactions as transaction (transaction.txId)}
					<div
						class="flex items-center px-6 py-4 border-b border-gray-800 last:border-b-0 hover:bg-gray-750 transition-colors"
					>
						<div class="flex-1 flex items-center">
							<span class="mr-3">
								{#if transaction.type === "lock"}
									<svg
										class="w-5 h-5 text-orange-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<rect
											x="6"
											y="10"
											width="12"
											height="10"
											rx="2"
											stroke-width="2"
										/>
										<path
											d="M8 10V7a4 4 0 0 1 8 0v3"
											stroke-width="2"
											stroke-linecap="round"
										/>
										<circle cx="12" cy="15" r="1.5" fill="currentColor" />
									</svg>
								{:else}
									<svg
										class="w-5 h-5 text-teal-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<rect
											x="2"
											y="7"
											width="20"
											height="10"
											rx="2"
											stroke-width="2"
										/>
										<circle cx="12" cy="12" r="2" stroke-width="2" />
										<path
											d="M6 10v4M18 10v4"
											stroke-width="2"
											stroke-linecap="round"
										/>
										<path
											d="M12 3v4M10 5l2-2 2 2"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
								{/if}
							</span>
							<span
								class="font-mono text-gray-300 hover:text-blue-400 transition-colors cursor-pointer"
							>
								{truncateHash(transaction.txId)}
							</span>
							<span class="ml-3 text-xs text-gray-500">
								{format(transaction.blockTimeIso!, "MMM d, yyyy hh:mm a")}
							</span>
						</div>
						<div class="w-20 text-center">
							<span
								class={`text-xs px-2 py-1 rounded ${getStatusColor(transaction.txStatus)}`}
							>
								{transaction.txStatus}
							</span>
						</div>
						<div class="w-22 text-center">
							<span
								class={`text-xs px-2 py-1 rounded ${getAmountColor(transaction.type)}`}
							>
								{getAmountPrefix(transaction.type)}
								{microStxToStx(transaction.amount)} STX
							</span>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>

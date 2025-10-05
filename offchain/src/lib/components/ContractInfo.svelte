<script lang="ts">
	import type { ContractConfig, WalletState } from "$lib/types";

	interface Props {
		contractConfig: ContractConfig;
		walletState: WalletState;
	}

	let { contractConfig, walletState }: Props = $props();

	function getNetworkDisplayName(network: string) {
		switch (network) {
			case "mainnet":
				return "Stacks Mainnet";
			case "testnet":
				return "Stacks Testnet";
			case "devnet":
				return "Stacks Devnet";
			default:
				return "Stacks Network";
		}
	}
</script>

{#if walletState.isConnected}
	<div class="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
		<div class="text-sm text-gray-400">
			<div>
				Contract: {contractConfig.address}.{contractConfig.name}
			</div>
			<div class="mt-1">
				Network: {getNetworkDisplayName(contractConfig.network)}
			</div>
		</div>
	</div>
{/if}

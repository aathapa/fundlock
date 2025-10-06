import { browser } from "$app/environment";
import { WalletService } from "$lib/services/WalletService";
import { websocketStore } from "$lib/stores/websocket.svelte";
import type { WalletState, ContractConfig } from "$lib/types";
import { CONTRACT_ADDRESS, NETWORK } from "$lib/utils/envData";
import { disconnect } from "@stacks/connect";

const CONTRACT_CONFIG: ContractConfig = {
	address: CONTRACT_ADDRESS,
	name: "lock",
	network: NETWORK,
};

class WalletStore {
	walletState = $state<WalletState>({
		isConnected: false,
		isConnecting: false,
		address: "",
		balance: 0,
	});

	private walletService?: WalletService;

	constructor() {
		if (browser) {
			this.walletService = new WalletService(CONTRACT_CONFIG);
			this.walletService.setBalanceUpdateCallback((balance) => {
				this.walletState.balance = balance;
			});
			this.initializeIfAuthenticated();
		}
	}

	get contractConfig() {
		return CONTRACT_CONFIG;
	}

	get wsClient() {
		return websocketStore.client;
	}

	get wsConnected() {
		return websocketStore.isConnected;
	}

	setWsClient(client: any) {
		this.walletService?.setWsClient(client);
	}

	private async initializeIfAuthenticated() {
		if (!browser || !this.walletService) return;
		if (!this.walletService?.isAuthenticated()) return;

		this.walletState.isConnecting = true;
		try {
			const isAccessible = await this.walletService.isWalletAccessible();

			if (!isAccessible) {
				this.walletState.isConnecting = false;
				this.walletState.isConnected = false;
				return;
			}

			const walletData = await this.walletService.initializeWallet();
			this.walletState = {
				isConnected: true,
				isConnecting: false,
				address: walletData.address,
				balance: walletData.balance,
			};

			this.subscribeToBalanceUpdates();
		} catch (error) {
			console.error("Error initializing wallet:", error);
			this.walletState.isConnecting = false;
			this.walletState.isConnected = false;
		}
	}

	async connectWallet() {
		if (!browser || !this.walletService) return;
		if (this.walletState.isConnected || this.walletState.isConnecting) return;

		this.walletState.isConnecting = true;

		try {
			await this.walletService.connectWallet();
			await new Promise((resolve) => setTimeout(resolve, 1000));

			const isAccessible = await this.walletService.isWalletAccessible();
			if (!isAccessible) {
				throw new Error("Wallet connected but addresses not accessible");
			}

			const walletData = await this.walletService.initializeWallet();

			this.walletState = {
				isConnected: true,
				isConnecting: false,
				address: walletData.address,
				balance: walletData.balance,
			};

			this.subscribeToBalanceUpdates();
		} catch (error) {
			console.error("Error connecting wallet:", error);
			this.walletState.isConnecting = false;
			this.walletState.isConnected = false;
			throw error;
		}
	}

	disconnectWallet() {
		if (!browser) return;
		this.walletService?.unsubscribeFromBalanceUpdates();

		disconnect();
		this.walletState = {
			isConnected: false,
			isConnecting: false,
			address: "",
			balance: 0,
		};
	}

	async refreshWalletData() {
		if (!browser || !this.walletService) return;
		if (!this.walletState.isConnected || !this.walletState.address) return;

		try {
			const balance = await this.walletService.getWalletBalance(
				this.walletState.address
			);

			this.walletState.balance = balance;
		} catch (error) {
			console.error("Error refreshing wallet data:", error);
		}
	}

	private subscribeToBalanceUpdates() {
		if (!browser || !this.walletState.address || !this.walletService) return;

		this.walletService.subscribeToBalanceUpdates(this.walletState.address);
	}

	async lockFunds(amount: number): Promise<string> {
		if (!browser || !this.walletService) {
			throw new Error("Browser environment required");
		}

		if (amount > this.walletState.balance) {
			throw new Error("Insufficient wallet balance");
		}

		try {
			const result = await this.walletService.lockFunds(
				this.walletState.address,
				amount
			);
			await this.refreshWalletData();
			return result.txId;
		} catch (error) {
			console.error("Error locking funds:", error);
			throw error;
		}
	}

	async withdrawFunds(amount: number): Promise<string> {
		if (!browser || !this.walletService) {
			throw new Error("Browser environment required");
		}

		if (!this.walletState.isConnected) {
			throw new Error("Wallet not connected");
		}

		try {
			const result = await this.walletService.withdrawFunds(amount);
			await this.refreshWalletData();
			return result.txId;
		} catch (error) {
			console.error("Error withdrawing funds:", error);
			throw error;
		}
	}
}

export const walletStore = new WalletStore();

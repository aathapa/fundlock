import { connect, isConnected, request } from "@stacks/connect";
import { Cl, Pc, fetchCallReadOnlyFunction } from "@stacks/transactions";
import type { StacksApiWebSocketClient } from "@stacks/blockchain-api-client";

import type {
	ContractConfig,
	WalletBalance,
	StacksAddress,
	ITransaction,
} from "$lib/types";
import type {
	AddressEntry,
	GetAddressesResult,
	TransactionResult,
} from "@stacks/connect/dist/types/methods";
import { isClient, microStxToStx } from "$lib/utils";
import { API_URL } from "$lib/utils/envData";

interface IAddressEntry extends AddressEntry {
	addressType: string;
}

export type UnsubscribeCallback = () => void;

export class WalletService {
	private contractConfig: ContractConfig;
	private apiBase: string;
	private walletAddresses?: GetAddressesResult;
	private wsClient?: StacksApiWebSocketClient;
	private balanceUnsubscribe?: UnsubscribeCallback;
	private onBalanceUpdate?: (balance: number) => void;

	constructor(contractConfig: ContractConfig, apiBase: string = API_URL) {
		this.contractConfig = contractConfig;
		this.apiBase = apiBase;
	}

	public setWsClient(client: StacksApiWebSocketClient): void {
		this.wsClient = client;
	}

	/**
	 * Set callback for balance updates
	 */
	public setBalanceUpdateCallback(callback: (balance: number) => void): void {
		this.onBalanceUpdate = callback;
	}

	public isAuthenticated = (): boolean => isConnected();

	public async isWalletAccessible(): Promise<boolean> {
		try {
			if (!this.isAuthenticated()) {
				return false;
			}
			const response = await request("getAddresses");

			const isValid =
				response &&
				response.addresses &&
				Array.isArray(response.addresses) &&
				response.addresses.length > 0;

			if (!isValid) return false;
			this.walletAddresses = response;
			return true;
		} catch {
			return false;
		}
	}

	public async connectWallet(): Promise<unknown> {
		try {
			if (!isClient()) {
				throw new Error("Wallet connection requires a browser environment");
			}

			const response = await connect();
			return response;
		} catch (error) {
			if (error instanceof Error && error.message.includes("rejected")) {
				throw new Error("Wallet connection was rejected by user");
			}
			throw new Error(
				"Failed to connect wallet - please ensure you have a Stacks wallet installed"
			);
		}
	}

	public async getAddresses(): Promise<unknown> {
		try {
			const response = await request("getAddresses");
			return response.addresses;
		} catch (error) {
			console.error("Error getting addresses:", error);
			throw new Error("Failed to get wallet addresses");
		}
	}

	/**
	 * Get user's Stacks address
	 */
	public async getStacksAddress(): Promise<StacksAddress> {
		try {
			if (
				!this.walletAddresses ||
				!this.walletAddresses.addresses ||
				!Array.isArray(this.walletAddresses.addresses)
			) {
				throw new Error(
					"No addresses available - wallet may not be properly connected"
				);
			}
			const stacksAddress = (
				this.walletAddresses.addresses as IAddressEntry[]
			).find((addr) => addr.addressType === "stacks");

			if (!stacksAddress) {
				throw new Error("No Stacks address found in wallet");
			}
			return {
				address: stacksAddress.address,
				addressType: "stacks",
			};
		} catch (error) {
			console.error("Error getting Stacks address:", error);
			throw error;
		}
	}

	/**
	 * Get wallet balance from Stacks API
	 */
	public async getWalletBalance(address: string): Promise<number> {
		try {
			const response = await fetch(
				`${this.apiBase}/extended/v1/address/${address}/balances`,
				{
					headers: {
						"Content-Type": "application/json",
					},
				}
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data: WalletBalance = await response.json();
			return microStxToStx(Number(data.stx.balance));
		} catch (error) {
			console.error("Error fetching wallet balance:", error);
			throw new Error("Failed to fetch wallet balance");
		}
	}

	/**
	 * Lock funds in the smart contract
	 */
	public async lockFunds(
		address: string,
		amount: number
	): Promise<{ txId: string; response: unknown }> {
		try {
			const amountMicroStx = amount * 1_000_000;

			const response = await request("stx_callContract", {
				contract: `${this.contractConfig.address}.${this.contractConfig.name}`,
				functionName: "lock-funds",
				functionArgs: [Cl.uint(amountMicroStx)],
				network: this.contractConfig.network,
				postConditions: [
					Pc.principal(address).willSendEq(amountMicroStx).ustx(),
				],
			});

			const txId = response?.txid || "unknown";

			return { txId, response };
		} catch (error) {
			throw new Error("Failed to lock funds");
		}
	}

	public async withdrawFunds(
		amount: number
	): Promise<{ txId: string; response: TransactionResult }> {
		try {
			const amountMicroStx = amount * 1_000_000;

			const response = await request("stx_callContract", {
				contract: `${this.contractConfig.address}.${this.contractConfig.name}`,
				functionName: "withdraw",
				functionArgs: [Cl.uint(amountMicroStx)],
				network: this.contractConfig.network,
				postConditions: [
					Pc.principal(
						`${this.contractConfig.address}.${this.contractConfig.name}`
					)
						.willSendEq(amountMicroStx)
						.ustx(),
				],
			});

			const txId = response.txid || "unknown";

			return { txId, response };
		} catch (error) {
			console.error("Error withdrawing funds:", error);
			throw new Error("Failed to withdraw funds");
		}
	}

	/**
	 * Initialize wallet connection and fetch all necessary data
	 */
	public async initializeWallet(): Promise<{
		address: string;
		balance: number;
	}> {
		try {
			const stacksAddress = await this.getStacksAddress();
			const balance = await this.getWalletBalance(stacksAddress.address);

			return {
				address: stacksAddress.address,
				balance,
			};
		} catch (error) {
			console.error("Error initializing wallet:", error);
			throw error;
		}
	}

	/**
	 * Subscribe to balance updates for an address
	 */
	public async subscribeToBalanceUpdates(
		address: string
	): Promise<UnsubscribeCallback | null> {
		if (!this.wsClient) return null;
		this.unsubscribeFromBalanceUpdates();

		try {
			const { unsubscribe } =
				await this.wsClient.subscribeAddressBalanceUpdates(
					address,
					async (update) => {
						this.onBalanceUpdate?.(microStxToStx(update.balance));
					}
				);
			this.balanceUnsubscribe = unsubscribe;
			return unsubscribe;
		} catch (error) {
			return null;
		}
	}

	/**
	 * Unsubscribe from balance updates
	 */
	public unsubscribeFromBalanceUpdates(): void {
		if (this.balanceUnsubscribe) {
			this.balanceUnsubscribe();
			this.balanceUnsubscribe = undefined;
		}
	}
}

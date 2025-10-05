import type { StacksApiWebSocketClient } from "@stacks/blockchain-api-client";
import type { ITransaction, TransactionStatus } from "$lib/types";
import camelcaseKeys from "camelcase-keys";
import { fetchCallReadOnlyFunction } from "@stacks/transactions";
import { CONTRACT_ADDRESS, NETWORK, API_URL } from "$lib/utils/envData";
import { microStxToStx } from "$lib/utils";

export type UnsubscribeCallback = () => void;

export class TransactionService {
	private client: { baseUrl: string };
	private wsClient?: StacksApiWebSocketClient;
	private activeSubscriptions: Map<string, UnsubscribeCallback> = new Map();
	private onTransactionUpdate?: (
		txId: string,
		status: TransactionStatus
	) => void;
	private onLockedAmountUpdate?: (amount: number) => void;
	private currentAddress?: string;

	constructor(apiUrl: string = API_URL, wsClient?: StacksApiWebSocketClient) {
		this.client = { baseUrl: apiUrl };

		if (wsClient) {
			this.wsClient = wsClient;
		}
	}

	/**
	 * Set WebSocket client from external source (e.g., context)
	 */
	public setWsClient(client: StacksApiWebSocketClient): void {
		this.wsClient = client;
	}

	/**
	 * Set callback for transaction updates
	 */
	public setUpdateCallback(
		callback: (txId: string, status: TransactionStatus) => void
	): void {
		this.onTransactionUpdate = callback;
	}

	/**
	 * Set callback for locked amount updates
	 */
	public setLockedAmountCallback(callback: (amount: number) => void): void {
		this.onLockedAmountUpdate = callback;
	}

	/**
	 * Set current user address for locked amount tracking
	 */
	public setAddress(address: string): void {
		this.currentAddress = address;
	}

	/**
	 * Start tracking a transaction by its ID
	 */
	public async trackTransaction(txId: string): Promise<UnsubscribeCallback> {
		if (this.activeSubscriptions.has(txId)) {
			return this.activeSubscriptions.get(txId)!;
		}

		let unsubscribeFunction: () => void;

		if (this.wsClient) {
			try {
				const { unsubscribe } = await this.wsClient.subscribeTxUpdates(
					txId,
					(update) => {
						const preparedData = this.prepareTransactionResponse(update);
						this.handleTransactionUpdate(
							txId,
							this.mapTransactionResponse(preparedData)
						);
					}
				);

				unsubscribeFunction = unsubscribe;
			} catch (error) {
				unsubscribeFunction = this.startPollingTransaction(txId);
			}
		} else {
			unsubscribeFunction = this.startPollingTransaction(txId);
		}

		this.activeSubscriptions.set(txId, unsubscribeFunction);
		return unsubscribeFunction;
	}

	/**
	 * Start polling for transaction updates
	 */
	private startPollingTransaction(txId: string): () => void {
		const checkInterval = setInterval(async () => {
			try {
				const transaction = await this.getTransactionDetails(txId);
				if (transaction && transaction.txStatus) {
					this.handleTransactionUpdate(txId, {
						txId: txId,
						txStatus: transaction.txStatus,
					});

					// Stop polling if transaction is complete
					if (
						transaction.txStatus === "success" ||
						transaction.txStatus === "abort_by_response" ||
						transaction.txStatus === "abort_by_post_condition"
					) {
						this.stopTracking(txId);
					}
				}
			} catch (error) {
				console.error(`Error polling transaction ${txId}:`, error);
			}
		}, 2000); // Poll every 2 seconds

		return () => {
			clearInterval(checkInterval);
			this.activeSubscriptions.delete(txId);
		};
	}

	/**
	 * Handle transaction updates from either WebSocket or polling
	 */
	private handleTransactionUpdate(
		txId: string,
		{ txStatus }: Pick<ITransaction, "txId" | "txStatus">
	): void {
		let status: TransactionStatus = "pending";

		if (txStatus === "success") {
			status = "success";
		} else if (
			txStatus === "abort_by_response" ||
			txStatus === "abort_by_post_condition"
		) {
			status = "failed";
		} else {
			status = "pending";
		}

		this.onTransactionUpdate?.(txId, status);

		// Fetch updated locked amount when transaction succeeds
		if (status === "success" && this.currentAddress) {
			this.fetchLockedAmount(this.currentAddress);
		}

		if (status === "success" || status === "failed") {
			this.stopTracking(txId);
		}
	}

	/**
	 * Stop tracking a specific transaction
	 */
	public stopTracking(txId: string): void {
		const unsubscribe = this.activeSubscriptions.get(txId);
		if (unsubscribe) {
			unsubscribe();
		}
	}

	/**
	 * Stop tracking all transactions
	 */
	public stopAllTracking(): void {
		this.activeSubscriptions.forEach((unsubscribe) => unsubscribe());
		this.activeSubscriptions.clear();
	}

	/**
	 * Get list of currently tracked transaction IDs
	 */
	public getTrackedTransactions(): string[] {
		return Array.from(this.activeSubscriptions.keys());
	}

	/**
	 * Check if a transaction is currently being tracked
	 */
	public isTracking(txId: string): boolean {
		return this.activeSubscriptions.has(txId);
	}

	/**
	 * Get transaction details from the API
	 */
	public async getTransactionDetails(txId: string): Promise<ITransaction> {
		try {
			const response = await fetch(
				`${this.client.baseUrl}/extended/v1/tx/${txId}`
			);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			let data = await response.json();
			data = this.prepareTransactionResponse(data);
			const transaction = this.mapTransactionResponse(data);
			return transaction;
		} catch (error) {
			console.error(`Error fetching transaction details for ${txId}:`, error);
			throw error;
		}
	}

	public async listTransactions(
		address: string,
		limit: number = 10,
		offset: number = 0
	): Promise<ITransaction[]> {
		try {
			const response = await fetch(`/api/${address}/transactions`);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			const transactions = data.map(this.prepareTransactionResponse);
			return camelcaseKeys(transactions, { deep: true });
		} catch (error) {
			console.error(`Error listing transactions for ${address}:`, error);
			throw error;
		}
	}

	/**
	 * Cleanup when service is destroyed
	 */
	public cleanup(): void {
		this.stopAllTracking();
	}

	/**
	 * Get locked amount from smart contract
	 */
	public async getLockedAmount(userAddress: string): Promise<number> {
		try {
			const response = await fetchCallReadOnlyFunction({
				contractName: "lock",
				contractAddress: CONTRACT_ADDRESS,
				functionName: "get-locked-amount",
				senderAddress: userAddress,
				functionArgs: [],
				network: NETWORK,
			});

			const clarityValue = response as { value?: number };
			const value = clarityValue.value || 0;
			return microStxToStx(Number(value));
		} catch (error) {
			console.error("Error fetching locked amount:", error);
			throw new Error("Failed to fetch locked amount");
		}
	}

	/**
	 * Fetch locked amount and notify callback
	 */
	private async fetchLockedAmount(address: string): Promise<void> {
		try {
			const lockedAmount = await this.getLockedAmount(address);
			if (this.onLockedAmountUpdate) {
				this.onLockedAmountUpdate(lockedAmount);
			}
		} catch (error) {
			console.error("Error fetching locked amount:", error);
		}
	}

	private prepareTransactionResponse(response: any): ITransaction {
		return {
			...response,
			amount: response.post_conditions?.[0]?.amount,
			type:
				response.contract_call?.function_name === "withdraw"
					? "withdraw"
					: "lock",
		};
	}

	private mapTransactionResponse(response: any) {
		return camelcaseKeys(response, { deep: true }) as ITransaction;
	}
}

import { TransactionService } from "$lib/services/TransactionService";
import type { ITransaction, TransactionStatus } from "$lib/types";
import { toIsoDate } from "$lib/utils";
import type { StacksApiWebSocketClient } from "@stacks/blockchain-api-client";

class TransactionStore {
	transactions = $state<ITransaction[]>([]);
	isLoading = $state(false);
	lockedAmount = $state<number>(0);
	private tracker: TransactionService;

	constructor() {
		this.tracker = new TransactionService();
		this.tracker.setUpdateCallback(
			(txId: string, status: TransactionStatus) => {
				this.updateTransactionStatus(txId, status);
			}
		);
		this.tracker.setLockedAmountCallback((amount: number) => {
			this.lockedAmount = amount;
		});
	}

	setWsClient(client: StacksApiWebSocketClient) {
		this.tracker.setWsClient(client);
	}

	public async loadTransactions(address: string) {
		this.isLoading = true;
		try {
			this.tracker.setAddress(address);
			const transactions = await this.tracker.listTransactions(address);
			this.transactions = transactions || [];
			await this.loadLockedAmount(address);
		} catch (error) {
			console.error("Error loading transactions:", error);
		} finally {
			this.isLoading = false;
		}
	}

	public async loadLockedAmount(address: string) {
		try {
			const amount = await this.tracker.getLockedAmount(address);
			this.lockedAmount = amount;
		} catch (error) {
			console.error("Error loading locked amount:", error);
		}
	}

	private updateTransactionStatus(
		txId: string,
		status: ITransaction["txStatus"]
	) {
		this.transactions = this.transactions.map((tx) =>
			tx.txId === txId ? { ...tx, txStatus: status } : tx
		);
	}

	addTransaction(
		transaction: Omit<ITransaction, "txId" | "blockTime">
	): ITransaction {
		const newTransaction: ITransaction = {
			...transaction,
			txId: "0x" + Math.random().toString(16).substr(2, 32),
			blockTime: Date.now(),
		};

		this.transactions = [newTransaction, ...this.transactions];

		return newTransaction;
	}

	addAndTrackTransaction(
		txId: string,
		transaction: Omit<ITransaction, "txId" | "blockTime">
	): ITransaction {
		const newTransaction: ITransaction = {
			txId: txId,
			...transaction,
			blockTime: Date.now(),
			blockTimeIso: toIsoDate(Date.now()),
		};

		this.transactions = [newTransaction, ...this.transactions];
		this.tracker.trackTransaction(txId);
		return newTransaction;
	}

	clearTransactions() {
		this.transactions = [];
	}

	cleanup() {
		this.tracker.cleanup();
	}
}

export const transactionStore = new TransactionStore();

export interface ITransaction {
	txId: string;
	amount: string;
	type: "lock" | "withdraw";
	burnBlockTime?: number;
	blockTime?: number;
	blockHash?: string;
	blockTimeIso?: string;
	burnBlockTimeIso?: string;
	txStatus: TransactionStatus;
}

export interface WalletState {
	isConnected: boolean;
	isConnecting: boolean;
	address: string;
	balance: number;
}

export interface TransactionFormData {
	amount: string;
	type: "lock" | "withdraw";
}

export interface ContractConfig {
	address: string;
	name: string;
	network: "mainnet" | "testnet" | "devnet";
}

export interface WalletBalance {
	stx: {
		balance: string;
		locked: string;
		unlock_height: number;
	};
}

export interface StacksAddress {
	address: string;
	addressType: string;
}

export interface ConnectResponse {
	addresses: StacksAddress[];
}

export type TransactionType = "lock" | "withdraw";
export type TransactionStatus =
	| "pending"
	| "success"
	| "failed"
	| "abort_by_response"
	| "abort_by_post_condition";
export type ActiveTab = "lock" | "withdraw";

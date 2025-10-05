import { formatISO } from "date-fns/formatISO";

/**
 * Format timestamp to localized time string
 */
export const formatTime = (timestamp: number): string => {
	const date = new Date(timestamp);
	return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const toIsoDate = (
	date: string | Date | number = new Date()
): string => {
	return formatISO(date);
};

/**
 * Truncate transaction hash for display
 */
export const truncateHash = (hash: string): string => {
	return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
};

/**
 * Truncate wallet address for display
 */
export const truncateAddress = (address: string): string => {
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Validate transaction amount
 */
export const validateAmount = (
	amount: string,
	maxAmount: number,
	type: "lock" | "withdraw"
): { isValid: boolean; error?: string } => {
	const numAmount = parseFloat(amount);

	if (!amount || isNaN(numAmount)) {
		return { isValid: false, error: "Please enter a valid amount" };
	}

	if (numAmount <= 0) {
		return { isValid: false, error: "Amount must be greater than 0" };
	}

	if (numAmount > maxAmount) {
		const balanceType = type === "lock" ? "wallet balance" : "locked balance";
		return { isValid: false, error: `Insufficient ${balanceType}` };
	}

	return { isValid: true };
};

/**
 * Format number to display with specified decimal places
 */
export const formatAmount = (amount: number, decimals: number = 6): string => {
	return amount.toFixed(decimals);
};

/**
 * Convert STX to microSTX
 */
export const stxToMicroStx = (stx: number | string): number => {
	if (typeof stx === "string") {
		stx = parseFloat(stx);
	}
	return stx * 1_000_000;
};

/**
 * Convert microSTX to STX
 */
export const microStxToStx = (microStx: number | string): number => {
	if (typeof microStx === "string") {
		microStx = parseFloat(microStx);
	}
	return microStx / 1_000_000;
};

/**
 * Check if wallet is connected and has valid address
 */
export const isWalletReady = (
	isConnected: boolean,
	address: string
): boolean => {
	return isConnected && Boolean(address);
};

/**
 * Generate a random transaction hash for mock data
 */
export const generateMockTxHash = (): string => {
	return "0x" + Math.random().toString(16).substr(2, 32);
};

export const isClient = () => typeof window !== "undefined" && !!window;

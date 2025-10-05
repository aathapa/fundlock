import { browser } from "$app/environment";
import { WS_URL } from "$lib/utils/envData";
import {
	connectWebSocketClient,
	type StacksApiWebSocketClient,
} from "@stacks/blockchain-api-client";

class WebSocketStore {
	client = $state<StacksApiWebSocketClient | null>(null);
	isConnected = $state(false);
	isConnecting = $state(false);

	async connect() {
		if (this.isConnecting || this.isConnected) return;
		this.isConnecting = true;
		try {
			const wsClient = await connectWebSocketClient(WS_URL);
			this.client = wsClient;
			this.isConnected = true;
			return wsClient;
		} finally {
			this.isConnecting = false;
		}
	}

	disconnect() {
		if (this.client) {
			this.client = null;
		}
		this.isConnected = false;
		this.isConnecting = false;
	}

	async reconnect() {
		this.disconnect();
		await new Promise((resolve) => setTimeout(resolve, 1000));
		await this.connect();
	}
}

export const websocketStore = new WebSocketStore();

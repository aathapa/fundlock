import { json } from "@sveltejs/kit";
import type { RequestEvent } from "./$types";
import { API_URL, CONTRACT_SENDER_ADDRESS } from "$lib/server/secrets";

export const GET = async ({
	params: { sender },
}: RequestEvent): Promise<Response> => {
	const response = await fetch(
		`${API_URL}/extended/v1/address/${CONTRACT_SENDER_ADDRESS}.lock/transactions`
	);

	if (!response.ok) {
		return json({ error: "Failed to fetch transactions" }, { status: 500 });
	}

	const value = await response.json();
	const transactions = value.results.filter(
		(tx: any) => tx.tx_type === "contract_call" && tx.sender_address === sender
	);

	return json(transactions.reverse());
};

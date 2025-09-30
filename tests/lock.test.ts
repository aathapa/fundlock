import { initSimnet } from "@hirosystems/clarinet-sdk";
import { Cl } from "@stacks/transactions";
import { describe, expect, test } from "vitest";

const simnet = await initSimnet();
const accounts = simnet.getAccounts();

describe("lock_amount", () => {
	test("should lock tokens for a user", () => {
		lockTest({});
	});

	test("it will add amount if already locked", () => {
		const wallet_1 = accounts.get("wallet_1")!;

		lockTest({});
		lockTest({});

		const resp = simnet.callReadOnlyFn(
			"lock",
			"get-locked-amount",
			[],
			wallet_1
		);

		expect(resp.result).toBeUint(200);
	});

	test("it return error if amount is set <= 0", () => {
		const wallet_1 = accounts.get("wallet_1")!;

		const lock_resp = simnet.callPublicFn(
			"lock",
			"lock-funds",
			[Cl.uint(0)],
			wallet_1
		);
		expect(lock_resp.result).toBeErr(Cl.uint(100));
	});
});

describe("withdraw", () => {
	test("it should withdraw the fund", () => {
		const deployer = accounts.get("deployer")!;
		const { sender } = lockTest({});

		const amount = 10;

		const withdraw = simnet.callPublicFn(
			"lock",
			"withdraw",
			[Cl.uint(amount)],
			sender
		);

		expect(withdraw.result).toBeOk(Cl.bool(true));
		expect(withdraw.events[0].event).toBe("stx_transfer_event");
		expect(withdraw.events[0].data).toMatchObject({
			sender: `${deployer}.lock`,
			recipient: sender,
			amount: amount.toString(),
		});
	});

	test("it return error if user has not lock the amount", () => {
		const wallet_1 = accounts.get("wallet_1")!;
		const withdraw = simnet.callPublicFn(
			"lock",
			"withdraw",
			[Cl.uint(10)],
			wallet_1
		);

		expect(withdraw.result).toBeErr(Cl.uint(102));
	});
	test("it return error if user try to withdraw 0", () => {
		const { sender } = lockTest({});
		const withdraw = simnet.callPublicFn(
			"lock",
			"withdraw",
			[Cl.uint(0)],
			sender
		);

		expect(withdraw.result).toBeErr(Cl.uint(100));
	});
	test("it return error if lock amount is less than withdraw amount", () => {
		const { sender } = lockTest({ amount: 100 });
		const withdraw = simnet.callPublicFn(
			"lock",
			"withdraw",
			[Cl.uint(101)],
			sender
		);

		expect(withdraw.result).toBeErr(Cl.uint(102));
	});

	test("read ony", () => {
		const wallet_1 = accounts.get("wallet_1");
		const withdraw = simnet.callReadOnlyFn(
			"lock",
			"get-locked-amount",
			[],
			wallet_1
		);

		console.log(withdraw);
	});
});

const lockTest = ({
	amount = 100,
	senderWallet,
}: {
	amount?: number;
	senderWallet?: string;
}) => {
	const deployer = accounts.get("deployer")!;
	const sender = senderWallet || accounts.get("wallet_1")!;

	const lockResp = simnet.callPublicFn(
		"lock",
		"lock-funds",
		[Cl.uint(amount)],
		sender
	);

	expect(lockResp.result).toBeOk(Cl.bool(true));
	expect(lockResp.events).toHaveLength(1);
	expect(lockResp.events[0].event).toBe("stx_transfer_event");

	expect(lockResp.events[0].data).toMatchObject({
		amount: amount.toString(),
		recipient: `${deployer}.lock`,
		sender: sender,
	});

	return { lockResp, sender };
};

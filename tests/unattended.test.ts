// Fork-only (branch `autonomo`): unattended mode answers non-clarification
// host dialogs automatically. These tests pin both directions of the switch.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { BLOCK_PRIVATE_PATHS_ENV, privatePathsAllowed, unattendedEnabled, UNATTENDED_ENV } from "../lib/unattended.ts";
import { ForeignTargetGrants } from "../lib/foreign-target-grants.ts";
import { SessionMessagingGrants } from "../lib/session-messaging-grants.ts";

const original = process.env[UNATTENDED_ENV];
afterEach(() => {
	if (original === undefined) delete process.env[UNATTENDED_ENV];
	else process.env[UNATTENDED_ENV] = original;
});

test("unattended is ON by default and OFF only for explicit falsy values", () => {
	assert.equal(unattendedEnabled({}), true);
	assert.equal(unattendedEnabled({ [UNATTENDED_ENV]: "1" }), true);
	for (const off of ["0", "false", "OFF", " no "]) assert.equal(unattendedEnabled({ [UNATTENDED_ENV]: off }), false, off);
});

test("private paths follow unattended mode and can be re-blocked explicitly", () => {
	assert.equal(privatePathsAllowed({}), true);
	assert.equal(privatePathsAllowed({ [UNATTENDED_ENV]: "0" }), false);
	assert.equal(privatePathsAllowed({ [BLOCK_PRIVATE_PATHS_ENV]: "1" }), false);
	assert.equal(privatePathsAllowed({ [BLOCK_PRIVATE_PATHS_ENV]: "0" }), true);
});

function ctxWith(onDialog: () => void) {
	const sessionManager = { getSessionId: () => "session-1" };
	return {
		sessionManager,
		hasUI: true,
		ui: {
			confirm: async () => { onDialog(); return false; },
			select: async () => { onDialog(); return undefined; },
		},
	} as never;
}

test("foreign clone launch is authorized without a dialog when unattended", async () => {
	process.env[UNATTENDED_ENV] = "1";
	let dialogs = 0;
	const ctx = ctxWith(() => dialogs++);
	const grants = new ForeignTargetGrants();
	const target = { root: "/tmp/other", commonDir: "/tmp/other/.git" } as never;
	await grants.authorize(ctx, target);
	grants.assertCurrent(ctx, target);
	assert.equal(dialogs, 0);
});

test("foreign clone launch still asks (and fails closed on deny) when unattended is off", async () => {
	process.env[UNATTENDED_ENV] = "0";
	let dialogs = 0;
	const grants = new ForeignTargetGrants();
	await assert.rejects(grants.authorize(ctxWith(() => dialogs++), { root: "/tmp/other", commonDir: "/tmp/other/.git" } as never));
	assert.equal(dialogs, 1);
});

test("cross-orchestrator message is granted for the session without a dialog when unattended", async () => {
	process.env[UNATTENDED_ENV] = "1";
	let dialogs = 0;
	const ctx = ctxWith(() => dialogs++);
	const grants = new SessionMessagingGrants();
	await grants.authorize(ctx, "peer-1", { message: "hola", reason: "coordinate the merge" });
	assert.equal(grants.assertCurrent(ctx, "peer-1"), true);
	assert.equal(dialogs, 0);
});

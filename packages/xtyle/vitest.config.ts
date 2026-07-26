import { defineConfig } from "vitest/config";

// HACK: `full`'s hundreds of blocking QuickJS derivations starve vitest's worker heartbeat in
// parallel workers ("Timeout calling onTaskUpdate"), so `full` runs files sequentially
const isFull = process.env.XTYLE_GAUNTLET_DEPTH === "full";

export default defineConfig({
	test: {
		fileParallelism: !isFull,
		testTimeout: 60_000,
		hookTimeout: 60_000,
	},
});

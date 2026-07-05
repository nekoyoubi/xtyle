import { defineConfig } from "vitest/config";

// Only the `full` battery makes mod-host run hundreds of synchronous QuickJS derivations; that
// blocking work in parallel worker threads starves vitest's worker-pool RPC heartbeat and aborts
// the run ("Timeout calling onTaskUpdate") — a false failure unrelated to the code. So `full` runs
// files sequentially in one worker to keep the heartbeat responsive. Routine runs (quick / standard /
// unset) only do a light hosted smoke, so files parallelize safely and the per-file transform/load
// overlaps across cores instead of serializing — which is most of the routine wall-clock.
const isFull = process.env.XTYLE_GAUNTLET_DEPTH === "full";

export default defineConfig({
	test: {
		fileParallelism: !isFull,
		testTimeout: 60_000,
		hookTimeout: 60_000,
	},
});

import { defineConfig, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { ALGORITHMS } from "./specs/lib/theme.ts";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");

export default defineConfig({
	testDir: "./specs",
	snapshotPathTemplate: "{testDir}/__baselines__/{projectName}/{arg}{ext}",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	// A missing baseline is a hard failure, never an auto-write. Under the default
	// "missing", the first attempt writes the actual and fails, then a retry finds
	// the file it just wrote and passes: a new component silently baselines itself
	// to whatever it rendered that day. "none" writes nothing, so every retry fails
	// identically. `npm run test:visual:update` passes --update-snapshots, which
	// overrides this and stays the one way to create or refresh a baseline.
	updateSnapshots: "none",
	// Animation-adjacent demos (carousel, timeline) can catch a mid-settle frame
	// under heavy worker contention; a real regression fails every attempt, a
	// timing flake passes on retry.
	retries: 2,
	workers: process.env.CI ? 4 : 6,
	reporter: [["list"], ["html", { open: "never" }]],
	expect: {
		toHaveScreenshot: {
			maxDiffPixelRatio: 0.01,
			threshold: 0.2,
			animations: "disabled",
			caret: "hide",
		},
	},
	use: {
		baseURL: "http://localhost:4382",
		reducedMotion: "reduce",
		viewport: { width: 1280, height: 900 },
		deviceScaleFactor: 1,
		trace: "on-first-retry",
	},
	projects: [
		...ALGORITHMS.map((algorithm) => ({
			name: algorithm,
			metadata: { algorithm },
			testMatch: /demos\.spec\.ts/,
			use: { ...devices["Desktop Chrome"], channel: undefined },
		})),
		{
			name: "parity",
			testMatch: /parity\.spec\.ts/,
			use: { ...devices["Desktop Chrome"], channel: undefined },
		},
	],
	webServer: {
		command: "npm run build && npm run preview -w @xtyle/site -- --port 4382",
		cwd: repoRoot,
		env: { ...process.env, XTYLE_REGRESSION: "1" },
		url: "http://localhost:4382",
		reuseExistingServer: !process.env.CI,
		timeout: 300_000,
		stdout: "pipe",
		stderr: "pipe",
	},
});

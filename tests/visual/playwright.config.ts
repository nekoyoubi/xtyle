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
	// INFO: the default "missing" auto-writes a baseline on retry (a new component silently
	// self-baselines); "none" fails every retry, and --update-snapshots is the only way to create/refresh
	updateSnapshots: "none",
	// INFO: retries absorb animation-adjacent flake (carousel, timeline) catching a mid-settle frame; a real regression still fails every attempt
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

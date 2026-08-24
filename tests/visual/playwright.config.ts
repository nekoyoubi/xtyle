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
			maxDiffPixels: 400,
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
		// INFO: the only project with no anchor seed, so it is the only one that renders an algorithm's
		// own declared anchors rather than a caller's surface — and the only one that renders light.
		{
			name: "light",
			metadata: { algorithm: "xtyle-default", scheme: "light" },
			testMatch: /demos\.spec\.ts/,
			use: { ...devices["Desktop Chrome"], channel: undefined },
		},
		{
			name: "parity",
			testMatch: /parity\.spec\.ts/,
			use: { ...devices["Desktop Chrome"], channel: undefined },
		},
		{
			name: "events",
			testMatch: /(events|keyboard|forms)\.spec\.ts/,
			use: { ...devices["Desktop Chrome"], channel: undefined },
		},
		// INFO: structural, never pixel — glyph rasterisation differs per engine, so a cross-engine
		// baseline diffs fonts rather than markup and teaches you to ignore it.
		{
			name: "firefox",
			testMatch: /(render|bench|events|keyboard|forms)\.spec\.ts/,
			use: { ...devices["Desktop Firefox"] },
		},
		{
			name: "webkit",
			testMatch: /(render|bench|events|keyboard|forms)\.spec\.ts/,
			use: { ...devices["Desktop Safari"] },
		},
		// INFO: the only project that isn't 1280 wide — every other sweep would pass a layout that
		// only breaks on a phone.
		{
			name: "narrow",
			testMatch: /narrow\.spec\.ts/,
			use: { ...devices["Desktop Chrome"], channel: undefined, viewport: { width: 390, height: 844 } },
		},
		{
			name: "rtl",
			testMatch: /rtl\.spec\.ts/,
			use: { ...devices["Desktop Chrome"], channel: undefined },
		},
		// INFO: the only project anchored on a brand that collides with a status role, so it is the
		// only one that renders the accent-collision guard at all.
		{
			name: "crimson",
			testMatch: /collision\.spec\.ts/,
			use: { ...devices["Desktop Chrome"], channel: undefined },
		},
		{
			name: "no-js",
			testMatch: /(render|bench-noscript)\.spec\.ts/,
			use: { ...devices["Desktop Chrome"], channel: undefined, javaScriptEnabled: false },
		},
		{
			name: "authoring",
			testMatch: /authoring\.spec\.ts/,
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

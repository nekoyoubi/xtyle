import { test, expect } from "@playwright/test";
import type { Page, TestInfo, Locator } from "@playwright/test";
import { themeEnvelope } from "./lib/theme.ts";
import { compareShots, STRICT, LOOSE } from "./lib/parity-diff.ts";
import type { Tolerance } from "./lib/parity-diff.ts";
import { hideChrome } from "./lib/prepare.ts";
import { REGRESSION_IDS } from "../../../apps/site/src/regression/ids.ts";

// Not meaningfully comparable as a single 360px instance: these are full-page
// layout shells and composed chrome that render regions/slotted structure, not
// one self-contained widget. Their cross-binding correctness is covered by the
// Leg 1 demo screenshots instead.
const PARITY_EXEMPT = new Set([
	"app-shell",
	"mobile-shell",
	"parallax",
	"statusbar",
	"toolbar",
	// Its items are sub-components (an accordion item is its own element); the
	// raw-HTML-child harness can't feed the Svelte binding the way a real Svelte
	// author would (with the item wrapper), so the comparison isn't apples-to-apples.
	"accordion",
	// Intended progressive enhancement, not a divergence to fix: the Astro (SSR)
	// binding renders the option list inline (~140px, a functional no-JS select)
	// and the runtime element collapses it to a trigger (~65px) once hydrated.
	"select",
]);

// The runtime elements fill their fragments asynchronously (the first fill on
// each page also pays a one-time xript-runtime init), so a single capture can
// catch a half-filled element. Poll until the column stops changing.
async function stableShot(
	page: Page,
	loc: Locator,
	{ tries = 10, gap = 200 } = {},
): Promise<Buffer | null> {
	let prev: Buffer | "empty" | null = null;
	for (let i = 0; i < tries; i++) {
		const box = await loc.boundingBox();
		if (!box || box.width < 1 || box.height < 1) {
			if (prev === "empty") return null;
			prev = "empty";
			await page.waitForTimeout(gap);
			continue;
		}
		const shot = await page.screenshot({ clip: box, animations: "disabled" });
		if (prev instanceof Buffer && Buffer.compare(prev, shot) === 0) return shot;
		prev = shot;
		await page.waitForTimeout(gap);
	}
	return prev instanceof Buffer ? prev : null;
}

async function assertParity(
	page: Page,
	testInfo: TestInfo,
	a: { name: string; shot: Buffer | null },
	b: { name: string; shot: Buffer | null },
	tol: Tolerance,
) {
	// Both columns rendered nothing inline (e.g. a closed overlay): vacuously
	// in parity — there is no rendered furniture to diverge.
	if (a.shot === null && b.shot === null) return;

	if (a.shot === null || b.shot === null) {
		expect(
			false,
			`${a.name} ↔ ${b.name}: one binding rendered inline content and the other did not (${a.name}=${a.shot ? "content" : "empty"}, ${b.name}=${b.shot ? "content" : "empty"})`,
		).toBe(true);
		return;
	}

	const result = compareShots(a.shot, b.shot, tol);
	if (!result.ok) {
		await testInfo.attach(`${a.name}.png`, { body: a.shot, contentType: "image/png" });
		await testInfo.attach(`${b.name}.png`, { body: b.shot, contentType: "image/png" });
		if (result.diffPng) {
			await testInfo.attach(`${a.name}-vs-${b.name}-diff.png`, {
				body: result.diffPng,
				contentType: "image/png",
			});
		}
	}
	expect(result.ok, `${a.name} ↔ ${b.name}: ${result.reason}`).toBe(true);
}

test.describe("binding parity", () => {
	for (const id of REGRESSION_IDS) {
		test(id, async ({ page, context }, testInfo) => {
			test.skip(PARITY_EXEMPT.has(id), "layout/chrome shell — see PARITY_EXEMPT");
			await context.addInitScript((envJson: string) => {
				localStorage.setItem("xtyle.themes.v1", envJson);
			}, themeEnvelope("xtyle-default"));

			const jsErrors: string[] = [];
			page.on("console", (msg) => {
				if (msg.type() === "error" && !/Failed to load resource/i.test(msg.text()))
					jsErrors.push(msg.text());
			});
			page.on("pageerror", (err) => jsErrors.push(String(err)));

			await page.goto(`/regression/${id}`);
			await page.waitForFunction(
				() =>
					document.documentElement.getAttribute("data-parity-ready") === "1",
				undefined,
				{ timeout: 15_000 },
			);
			await hideChrome(page);
			await page.waitForTimeout(250);

			const mountError = await page.evaluate(() =>
				document.documentElement.getAttribute("data-parity-error"),
			);
			if (mountError) {
				testInfo.annotations.push({ type: "mount-error", description: mountError });
			}

			const raw = {
				name: "raw",
				shot: await stableShot(page, page.locator('[data-binding="raw"]')),
			};
			const svelte = {
				name: "svelte",
				shot: await stableShot(page, page.locator('[data-binding="svelte"]')),
			};
			const astro = {
				name: "astro",
				shot: await stableShot(page, page.locator('[data-binding="astro"]')),
			};

			await assertParity(page, testInfo, raw, svelte, STRICT);
			await assertParity(page, testInfo, raw, astro, LOOSE);

			expect(
				jsErrors,
				`JS errors on /regression/${id}:\n${jsErrors.join("\n")}`,
			).toEqual([]);
		});
	}
});

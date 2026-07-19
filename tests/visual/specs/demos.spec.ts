import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { Algorithm } from "./lib/theme.ts";
import { themeEnvelope } from "./lib/theme.ts";
import { COMPONENTS } from "./lib/components.ts";
import { hideChrome } from "./lib/prepare.ts";

async function prepareForShot(page: Page) {
	await hideChrome(page);

	const canvas = page.locator(".ref-stage-card__canvas");
	// Fit the viewport to the demo, then wait for its height to hold steady: a
	// late font swap or reflow shifts everything below it, and a capture caught
	// mid-shift diffs the whole lower half of a tall demo against the baseline.
	let lastHeight = -1;
	for (let i = 0; i < 10; i++) {
		const box = await canvas.boundingBox();
		if (!box) break;
		const height = Math.ceil(box.height);
		if (height === lastHeight) break;
		lastHeight = height;
		await page.setViewportSize({
			width: 1280,
			height: Math.min(height + 48, 4000),
		});
		await page.evaluate(() => document.fonts.ready.then(() => true));
		await page.waitForTimeout(150);
	}
}

test.describe("component demos", () => {
	for (const id of COMPONENTS) {
		test(id, async ({ page, context }, testInfo) => {
			const algorithm = testInfo.project.metadata.algorithm as Algorithm;

			await context.addInitScript((envJson: string) => {
				localStorage.setItem("xtyle.themes.v1", envJson);
			}, themeEnvelope(algorithm));

			const jsErrors: string[] = [];
			const resourceWarnings: string[] = [];
			const isResourceLoad = (t: string) =>
				/Failed to load resource/i.test(t);
			page.on("console", (msg) => {
				if (msg.type() !== "error") return;
				const text = msg.text();
				(isResourceLoad(text) ? resourceWarnings : jsErrors).push(text);
			});
			page.on("pageerror", (err) => jsErrors.push(String(err)));

			await page.goto(`/components/${id}`);

			await page.waitForFunction(
				() =>
					document.documentElement.style
						.getPropertyValue("--bg-0")
						.trim().length > 0,
				undefined,
				{ timeout: 15_000 },
			);

			const canvas = page.locator(".ref-stage-card__canvas");
			await expect(canvas).toBeVisible();
			await expect(canvas).not.toBeEmpty();

			await prepareForShot(page);

			await expect(canvas).toHaveScreenshot(`${id}.png`);

			if (resourceWarnings.length) {
				testInfo.annotations.push({
					type: "resource-404",
					description: resourceWarnings.join("\n"),
				});
			}

			expect(
				jsErrors,
				`JS errors on /components/${id}:\n${jsErrors.join("\n")}`,
			).toEqual([]);
		});
	}
});

import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { Algorithm } from "./lib/theme.ts";
import { themeEnvelope } from "./lib/theme.ts";
import { COMPONENTS } from "./lib/components.ts";
import { hideChrome } from "./lib/prepare.ts";
import { isResourceError } from "./lib/page.ts";

async function prepareForShot(page: Page) {
	await hideChrome(page);

	const canvas = page.locator(".ref-stage-card__canvas");
	// INFO: wait for the demo height to hold steady before capture; a late font swap or reflow shifts
	// everything below it, and a mid-shift capture diffs a tall demo's lower half against the baseline
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
			const scheme = testInfo.project.metadata.scheme as "light" | undefined;

			await context.addInitScript((envJson: string) => {
				localStorage.setItem("xtyle.themes.v1", envJson);
			}, themeEnvelope(algorithm, scheme ? { scheme, stated: true } : {}));

			const jsErrors: string[] = [];
			const resourceWarnings: string[] = [];
			const libraryComplaints: string[] = [];
			page.on("console", (msg) => {
				const text = msg.text();
				if (text.startsWith("xtyle")) {
					libraryComplaints.push(text);
					return;
				}
				if (msg.type() !== "error") return;
				(isResourceError(text) ? resourceWarnings : jsErrors).push(text);
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

			expect(
				[...new Set(libraryComplaints)],
				`components complained about their own usage on /components/${id}`,
			).toEqual([]);
		});
	}
});

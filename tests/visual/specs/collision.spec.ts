import { test, expect } from "@playwright/test";
import { CRIMSON_ANCHORS, themeEnvelope } from "./lib/theme.ts";
import { hideChrome } from "./lib/prepare.ts";

/**
 * The status roles under a brand that lands on one of them.
 *
 * The derivation holds `--danger` clear of a colliding accent, and no other project renders that:
 * every blessed algorithm anchors on a blue, so the guard never fires anywhere else in the suite. A
 * red brand is the input that turns it on, and these are the surfaces where a destructive control
 * reading as the primary one would actually be seen.
 */
const SURFACES = ["alert", "button", "badge"] as const;

test.describe("status roles under a colliding brand accent", () => {
	for (const id of SURFACES) {
		test(id, async ({ page, context }) => {
			await context.addInitScript((envJson: string) => {
				localStorage.setItem("xtyle.themes.v1", envJson);
			}, themeEnvelope("xtyle-default", CRIMSON_ANCHORS));

			await page.goto(`/components/${id}`);
			await page.waitForFunction(
				() => document.documentElement.style.getPropertyValue("--bg-0").trim().length > 0,
				undefined,
				{ timeout: 15_000 },
			);

			const accent = await page.evaluate(() =>
				getComputedStyle(document.documentElement).getPropertyValue("--accent").trim(),
			);
			const danger = await page.evaluate(() =>
				getComputedStyle(document.documentElement).getPropertyValue("--danger").trim(),
			);
			expect(accent, "the crimson anchor should have survived into the register").not.toBe("");
			expect(danger, "danger must not derive onto the brand it collides with").not.toBe(accent);

			await hideChrome(page);
			const canvas = page.locator(".ref-stage-card__canvas");
			await expect(canvas).toBeVisible();
			await expect(canvas).not.toBeEmpty();

			const box = await canvas.boundingBox();
			if (box) {
				await page.setViewportSize({ width: 1280, height: Math.min(Math.ceil(box.height) + 48, 4000) });
				await page.evaluate(() => document.fonts.ready.then(() => true));
				await page.waitForTimeout(150);
			}

			await expect(canvas).toHaveScreenshot(`${id}.png`);
		});
	}
});

import { test, expect } from "@playwright/test";

test("resolveColor turns a token mix into a concrete color the SVG flood paints", async ({ page }) => {
	await page.goto("/start/");
	const demo = page.locator("[data-resolve-demo]");
	const readout = demo.locator("[data-resolve-readout]");
	await expect(readout).toHaveText(/^#[0-9a-f]{6}$/);
	const hex = await readout.textContent();
	await expect(demo.locator("[data-resolve-flood]")).toHaveAttribute("flood-color", hex!);
	expect(hex).not.toBe("#000000");
});

import { test, expect } from "@playwright/test";

const PAGES = [
	{ path: "/bench/themes", escape: "/components" },
	{ path: "/bench/icons", escape: "/components/icon" },
];

test.describe("a bench says why it is empty without javascript", () => {
	for (const { path, escape } of PAGES) {
		test(path, async ({ page }) => {
			await page.goto(path, { waitUntil: "domcontentloaded" });

			const notice = page.locator('noscript [role="status"]');
			await expect(notice).toBeVisible();
			await expect(notice).toContainText("needs JavaScript to run at all");
			await expect(notice.locator(`a[href="${escape}"]`)).toBeVisible();
		});
	}
});

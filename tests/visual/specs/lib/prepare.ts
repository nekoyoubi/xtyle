import type { Page } from "@playwright/test";

/** Freeze the page for a screenshot: hide the toolbar/statusbar chrome both specs crop out, kill
 * animations and the caret, and wait for webfonts so a late swap doesn't shift the capture. */
export async function hideChrome(page: Page): Promise<void> {
	await page.addStyleTag({
		content: `
			[slot="toolbar"], [slot="statusbar"] { display: none !important; }
			*, *::before, *::after {
				animation: none !important;
				transition: none !important;
				caret-color: transparent !important;
			}
		`,
	});
	await page.evaluate(() => document.fonts.ready.then(() => true));
}

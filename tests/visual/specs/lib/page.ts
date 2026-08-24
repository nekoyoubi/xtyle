import type { Page } from "@playwright/test";

const RESOURCE_ERROR = /Failed to load resource|downloadable font|NS_BINDING_ABORTED|net::ERR_/i;

export function isResourceError(text: string): boolean {
	return RESOURCE_ERROR.test(text);
}

export async function waitForTheme(page: Page, timeout = 20_000): Promise<void> {
	await page.waitForFunction(
		() => document.documentElement.style.getPropertyValue("--bg-0").trim().length > 0,
		undefined,
		{ timeout },
	);
}

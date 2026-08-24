import { test, expect } from "@playwright/test";
import { MAIN_TABS, SCENES } from "../../../apps/site/src/components/bench/view.ts";
import { themeEnvelope } from "./lib/theme.ts";
import { isResourceError, waitForTheme } from "./lib/page.ts";

test.describe("every bench scene renders", () => {
	for (const { value: view } of MAIN_TABS) {
		for (const { value: scene } of SCENES[view] ?? []) {
			test(`${view}/${scene}`, async ({ page, context }) => {
				await context.addInitScript((envJson: string) => {
					localStorage.setItem("xtyle.themes.v1", envJson);
				}, themeEnvelope("xtyle-default"));

				const jsErrors: string[] = [];
				const libraryComplaints: string[] = [];
				page.on("console", (msg) => {
					const text = msg.text();
					if (text.startsWith("xtyle")) libraryComplaints.push(text);
					else if (msg.type() === "error" && !isResourceError(text)) jsErrors.push(text);
				});
				page.on("pageerror", (err) => jsErrors.push(String(err)));

				const address = `/bench/themes?view=${view}&scene=${scene}`;
				await page.goto(address, { waitUntil: "domcontentloaded" });
				await waitForTheme(page);

				const stage = page.locator(`[data-scene="${scene}"]`);
				await expect(stage).toBeVisible({ timeout: 90_000 });
				await expect(stage).not.toBeEmpty();

				await expect
					.poll(
						async () =>
							page.evaluate(() =>
								[...document.querySelectorAll("[data-root]")]
									.filter((root) => !root.children.length && !(root.textContent ?? "").trim())
									.map((root) => root.parentElement?.tagName.toLowerCase() ?? "?"),
							),
						{ message: `components that painted nothing on ${address}`, timeout: 15_000 },
					)
					.toEqual([]);

				expect(jsErrors, `errors on ${address}:\n${jsErrors.join("\n")}`).toEqual([]);
				expect(
					[...new Set(libraryComplaints)],
					`components complained about their own usage on ${address}`,
				).toEqual([]);
			});
		}
	}
});

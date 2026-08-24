import { test, expect } from "@playwright/test";
import { COMPONENTS } from "./lib/components.ts";
import { themeEnvelope } from "./lib/theme.ts";
import { isResourceError } from "./lib/page.ts";

const NO_JS = "no-js";

test.describe("every component renders", () => {
	for (const id of COMPONENTS) {
		test(id, async ({ page, context }, testInfo) => {
			const scripted = testInfo.project.name !== NO_JS;

			await context.addInitScript((envJson: string) => {
				localStorage.setItem("xtyle.themes.v1", envJson);
			}, themeEnvelope("xtyle-default"));

			const jsErrors: string[] = [];
			page.on("console", (msg) => {
				if (msg.type() === "error" && !isResourceError(msg.text())) jsErrors.push(msg.text());
			});
			page.on("pageerror", (err) => jsErrors.push(String(err)));

			await page.goto(`/components/${id}`, { waitUntil: "domcontentloaded" });

			const canvas = page.locator(".ref-stage-card__canvas");
			await expect(canvas).toBeVisible();
			await expect(canvas).not.toBeEmpty();

			// INFO: a fill mounts asynchronously, so on a slower engine the first read can land mid-mount;
			// polling keeps the assertion strict while letting the scaffold arrive.
			await expect
				.poll(
					async () =>
						canvas.evaluate((stage) =>
							[...stage.querySelectorAll("[data-root]")]
								.filter((root) => !root.children.length && !(root.textContent ?? "").trim())
								.map((root) => root.parentElement?.tagName.toLowerCase() ?? "?"),
						),
					{ message: `components that painted nothing on /components/${id}`, timeout: 10_000 },
				)
				.toEqual([]);

			const rawBackticks = await page.evaluate(() => {
				const article = document.querySelector("article.ref")?.cloneNode(true) as HTMLElement | undefined;
				if (!article) return ["no article.ref on the page"];
				for (const sample of article.querySelectorAll(
					".ref-stage-card__canvas, [data-code-tabs], pre, code, xtyle-code, script, style",
				))
					sample.remove();
				return [...article.querySelectorAll<HTMLElement>("section, .ref-summary, .ref-lede")]
					.filter((region) => (region.textContent ?? "").includes("`"))
					.map((region) => `${region.id || region.className}: ${(region.textContent ?? "").trim().slice(0, 120)}`);
			});
			expect(
				rawBackticks,
				`manifest prose reached /components/${id} without a markdown pass:\n${rawBackticks.join("\n")}`,
			).toEqual([]);

			expect(jsErrors, `errors on /components/${id}:\n${jsErrors.join("\n")}`).toEqual(
				scripted ? [] : jsErrors,
			);
		});
	}
});

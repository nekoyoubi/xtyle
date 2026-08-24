import { test, expect } from "@playwright/test";
import { COMPONENTS } from "./lib/components.ts";
import { themeEnvelope } from "./lib/theme.ts";

test.describe("no component page overflows a phone", () => {
	for (const id of COMPONENTS) {
		test(id, async ({ page, context }) => {
			await context.addInitScript((envJson: string) => {
				localStorage.setItem("xtyle.themes.v1", envJson);
			}, themeEnvelope("xtyle-default"));

			await page.goto(`/components/${id}`, { waitUntil: "domcontentloaded" });
			await expect(page.locator(".ref-stage-card__canvas")).toBeVisible();

			// INFO: the shell scrolls an inner `<main>`, not the window, so the document never reports
			// horizontal overflow however wide the content is — measure the element that actually scrolls.
			const overflow = await page.evaluate(() => {
				const scroller = document.querySelector("main#main") ?? document.documentElement;
				const over = scroller.scrollWidth - scroller.clientWidth;
				if (over <= 1) return { over: 0, widest: [] as string[] };
				const edge = scroller.getBoundingClientRect().right;
				// INFO: an element inside its own scroller is meant to run wide — a code block, a table.
				// Reporting those buries the one element that actually grew the page.
				const contained = (el: Element): boolean => {
					for (let a = el.parentElement; a && a !== scroller; a = a.parentElement) {
						const overflowX = getComputedStyle(a).overflowX;
						if (overflowX === "auto" || overflowX === "scroll" || overflowX === "hidden") return true;
					}
					return false;
				};
				const widest = [...scroller.querySelectorAll("*")]
					.map((el) => ({ el, right: Math.round(el.getBoundingClientRect().right) }))
					.filter((e) => e.right > edge + 1 && !contained(e.el))
					.sort((a, b) => b.right - a.right)
					.slice(0, 3)
					.map((e) => `${e.el.tagName.toLowerCase()}.${String(e.el.className).slice(0, 40)} right=${e.right}`);
				return { over, widest };
			});

			expect(
				overflow.over,
				`/components/${id} runs ${overflow.over}px past a 390px viewport:\n${overflow.widest.join("\n")}`,
			).toBeLessThanOrEqual(1);
		});
	}
});

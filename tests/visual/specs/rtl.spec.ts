import { test, expect } from "@playwright/test";
import { COMPONENTS } from "./lib/components.ts";
import { themeEnvelope } from "./lib/theme.ts";

/**
 * The bar here is that a right-to-left page still *holds together* — not that every component
 * mirrors. Mirroring is a per-component design question; a connector pinned with `left` that hangs
 * off the row and pushes the page sideways is a defect either way.
 */
test.describe("no component page breaks its layout right-to-left", () => {
	for (const id of COMPONENTS) {
		test(id, async ({ page, context }) => {
			await context.addInitScript((envJson: string) => {
				localStorage.setItem("xtyle.themes.v1", envJson);
				document.addEventListener("DOMContentLoaded", () => {
					document.documentElement.setAttribute("dir", "rtl");
				});
			}, themeEnvelope("xtyle-default"));

			await page.goto(`/components/${id}`, { waitUntil: "domcontentloaded" });
			await expect(page.locator(".ref-stage-card__canvas")).toBeVisible();
			await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

			const overflow = await page.evaluate(() => {
				const scroller = document.querySelector("main#main") ?? document.documentElement;
				const over = scroller.scrollWidth - scroller.clientWidth;
				if (over <= 1) return { over: 0, widest: [] as string[] };
				const box = scroller.getBoundingClientRect();
				const contained = (el: Element): boolean => {
					for (let a = el.parentElement; a && a !== scroller; a = a.parentElement) {
						const overflowX = getComputedStyle(a).overflowX;
						if (overflowX === "auto" || overflowX === "scroll" || overflowX === "hidden") return true;
					}
					return false;
				};
				const widest = [...scroller.querySelectorAll("*")]
					.map((el) => ({ el, rect: el.getBoundingClientRect() }))
					.filter((e) => (e.rect.right > box.right + 1 || e.rect.left < box.left - 1) && !contained(e.el))
					.slice(0, 3)
					.map((e) => `${e.el.tagName.toLowerCase()}.${String(e.el.className).slice(0, 40)}`);
				return { over, widest };
			});

			expect(
				overflow.over,
				`/components/${id} overflows ${overflow.over}px right-to-left:\n${overflow.widest.join("\n")}`,
			).toBeLessThanOrEqual(1);
		});
	}
});

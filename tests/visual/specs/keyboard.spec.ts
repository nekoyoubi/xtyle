import { test, expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { themeEnvelope } from "./lib/theme.ts";
import { waitForTheme } from "./lib/page.ts";

const settleFocusOn = async (page: Page, target: Locator) => {
	await expect
		.poll(
			async () => {
				await target.focus().catch(() => {});
				return target.evaluate((el) => el === document.activeElement || el.contains(document.activeElement));
			},
			{ message: "focus never settled on the item before the key was pressed", timeout: 10_000 },
		)
		.toBe(true);
};

const complaints = new WeakMap<Page, string[]>();

test.beforeEach(({ page }) => {
	const heard: string[] = [];
	complaints.set(page, heard);
	page.on("console", (msg) => {
		if (msg.text().startsWith("xtyle")) heard.push(msg.text());
	});
});

test.afterEach(({ page }) => {
	expect(
		[...new Set(complaints.get(page) ?? [])],
		"a component complained about its own usage while being driven from the keyboard",
	).toEqual([]);
});

const open = async (page: Page, id: string) => {
	await page.goto(`/components/${id}/`, { waitUntil: "domcontentloaded" });
	await waitForTheme(page);
};

const focused = (page: Page) =>
	page.evaluate(() => {
		const deep = (node: Element | null): Element | null => {
			const shadow = node?.shadowRoot?.activeElement;
			return shadow ? deep(shadow) : node;
		};
		const el = deep(document.activeElement);
		if (!el) return null;
		return {
			tag: el.tagName.toLowerCase(),
			role: el.getAttribute("role"),
			key: el.getAttribute("data-key"),
			text: (el.textContent ?? "").trim().slice(0, 24),
			inDialog: Boolean(el.closest("dialog, [role=dialog]")),
		};
	});

test.describe("a dialog keeps focus and gives it back", () => {
	test("moves focus inside on open, and restores it to the trigger on Escape", async ({ page, context }) => {
		await context.addInitScript((env: string) => localStorage.setItem("xtyle.themes.v1", env), themeEnvelope("xtyle-default"));
		await open(page, "dialog");

		const trigger = page.locator("[data-open=confirm]").locator("button").first();
		await trigger.focus();
		await trigger.press("Enter");

		await expect(page.locator("dialog[open]").first()).toBeVisible();
		await expect
			.poll(async () => (await focused(page))?.inDialog, { message: "focus never entered the dialog" })
			.toBe(true);

		await page.keyboard.press("Escape");
		await expect(page.locator("dialog[open]")).toHaveCount(0);
		await expect
			.poll(async () => trigger.evaluate((el) => el === document.activeElement || el.contains(document.activeElement)), {
				message: "focus never came back to the trigger that opened it",
			})
			.toBe(true);
	});
});

test.describe("a tab strip moves on the arrows", () => {
	test("keeps one tab stop and walks selection with ArrowRight", async ({ page, context }) => {
		await context.addInitScript((env: string) => localStorage.setItem("xtyle.themes.v1", env), themeEnvelope("xtyle-default"));
		await open(page, "tabs");

		const strip = page.locator("xtyle-tabs").first();
		const stops = await strip.evaluate((el) =>
			[...(el.shadowRoot ?? el).querySelectorAll('[role="tab"]')].map((tab) => tab.getAttribute("tabindex")),
		);
		expect(stops.filter((value) => value === "0"), "a roving tab strip carries exactly one tab stop").toHaveLength(1);

		const first = strip.locator('[role="tab"]').first();
		await settleFocusOn(page, first);
		const before = await focused(page);
		await page.keyboard.press("ArrowRight");

		await expect
			.poll(async () => (await focused(page))?.key, { message: "ArrowRight moved nothing" })
			.not.toBe(before?.key);
		expect((await focused(page))?.role, "the arrows should land on another tab").toBe("tab");
	});
});

test.describe("a switch answers the keyboard", () => {
	test("flips aria-checked on Space and reports it on the host", async ({ page, context }) => {
		await context.addInitScript((env: string) => localStorage.setItem("xtyle.themes.v1", env), themeEnvelope("xtyle-default"));
		await open(page, "switch");

		const host = page.locator("xtyle-switch").first();
		const control = host.locator('[role="switch"], input[type="checkbox"], button').first();
		const state = () =>
			control.evaluate((el) =>
				el.getAttribute("aria-checked") ?? String((el as HTMLInputElement).checked ?? ""),
			);

		await control.focus();
		const before = await state();
		await page.keyboard.press("Space");

		await expect.poll(state, { message: "Space did not flip the switch" }).not.toBe(before);
	});
});

const SUBSTRATE = [
	{ id: "segmented", host: "xtyle-segmented", item: '[role="radio"]', key: "ArrowRight" },
	{ id: "list", host: "xtyle-list[interaction=selectable]", item: '[role="option"]', key: "ArrowDown" },
	{ id: "tree", host: "xtyle-tree", item: '[role="treeitem"]', key: "ArrowDown" },
];

test.describe("the collection substrate rovers on one tab stop", () => {
	for (const skin of SUBSTRATE) {
		test(`${skin.id} keeps one tab stop and moves on ${skin.key}`, async ({ page, context }) => {
			await context.addInitScript((env: string) => localStorage.setItem("xtyle.themes.v1", env), themeEnvelope("xtyle-default"));
			await open(page, skin.id);

			const host = page.locator(skin.host).first();
			await expect(host).toBeVisible();

			const stops = await host.evaluate(
				(el, selector) =>
					[...(el.shadowRoot ?? el).querySelectorAll(selector)].map((item) => item.getAttribute("tabindex")),
				skin.item,
			);
			expect(stops.length, `${skin.id} rendered no items to rove across`).toBeGreaterThan(1);
			expect(
				stops.filter((value) => value === "0").length,
				`${skin.id} should expose exactly one tab stop, found ${stops.filter((v) => v === "0").length}`,
			).toBe(1);

			const first = host.locator(skin.item).first();
			await settleFocusOn(page, first);
			const before = await focused(page);
			await page.keyboard.press(skin.key);

			await expect
				.poll(async () => (await focused(page))?.text, { message: `${skin.key} moved nothing in ${skin.id}` })
				.not.toBe(before?.text);
		});
	}
});

test.describe("a menu opens on the keyboard and hands focus back", () => {
	test("ArrowDown opens onto an item, moves, and Escape returns to the trigger", async ({ page, context }) => {
		await context.addInitScript((env: string) => localStorage.setItem("xtyle.themes.v1", env), themeEnvelope("xtyle-default"));
		await open(page, "menu");

		const host = page.locator("xtyle-menu").first();
		const trigger = host.locator("[data-trigger]").first();
		await settleFocusOn(page, trigger);
		await page.keyboard.press("ArrowDown");

		await expect
			.poll(async () => (await focused(page))?.role, { message: "ArrowDown did not land focus on a menu item" })
			.toBe("menuitem");
		const first = await focused(page);

		await page.keyboard.press("ArrowDown");
		await expect
			.poll(async () => (await focused(page))?.text, { message: "ArrowDown did not move within the menu" })
			.not.toBe(first?.text);

		await page.keyboard.press("Escape");
		await expect
			.poll(
				async () => trigger.evaluate((el) => el === document.activeElement || el.contains(document.activeElement)),
				{ message: "Escape did not hand focus back to the trigger" },
			)
			.toBe(true);
	});
});

const VIRTUAL_CURSOR = [
	{ id: "combobox", host: "xtyle-combobox", launch: "" },
	{ id: "command-palette", host: "xtyle-command-palette", launch: "#cp-launch" },
];

test.describe("a virtual cursor moves without taking focus", () => {
	for (const skin of VIRTUAL_CURSOR) {
		test(`${skin.id} walks aria-activedescendant and leaves focus on the input`, async ({ page, context }) => {
			await context.addInitScript((env: string) => localStorage.setItem("xtyle.themes.v1", env), themeEnvelope("xtyle-default"));
			await open(page, skin.id);

			if (skin.launch) await page.locator(skin.launch).first().click();
			else await settleFocusOn(page, page.locator(skin.host).first().locator("input").first());

			const state = () =>
				page.evaluate(() => {
					const input = document.activeElement as HTMLInputElement | null;
					const owner = input?.closest?.("xtyle-combobox, xtyle-command-palette") ?? null;
					return {
						onInput: input?.tagName.toLowerCase() === "input",
						ad: input?.getAttribute?.("aria-activedescendant") ?? null,
						owned: Boolean(owner),
					};
				});

			await page.keyboard.press("ArrowDown");
			await expect.poll(async () => (await state()).ad, { message: `${skin.id} set no active descendant` }).toBeTruthy();
			const first = (await state()).ad;

			await page.keyboard.press("ArrowDown");
			await expect
				.poll(async () => (await state()).ad, { message: `${skin.id} did not move its active descendant` })
				.not.toBe(first);

			const end = await state();
			expect(end.onInput, `${skin.id} moved real focus off the input, which would break typing`).toBe(true);
			expect(end.owned, `${skin.id} left focus outside the component`).toBe(true);
		});
	}
});

test.describe("a date picker hands focus to its grid", () => {
	test("opens onto a day, walks the grid, and keeps focus on Escape", async ({ page, context }) => {
		await context.addInitScript((env: string) => localStorage.setItem("xtyle.themes.v1", env), themeEnvelope("xtyle-default"));
		await open(page, "date-picker");

		const host = page.locator("xtyle-date-picker").first();
		const trigger = host.locator(".xtyle-datepicker__trigger").first();
		await settleFocusOn(page, trigger);
		await trigger.press("Enter");
		await expect(page.locator("xtyle-popover[open]").first()).toBeVisible();

		await expect
			.poll(async () => (await focused(page))?.tag, { message: "opening the calendar did not move focus into the grid" })
			.toBe("td");
		const firstDay = await focused(page);

		await page.keyboard.press("ArrowRight");
		await expect
			.poll(async () => (await focused(page))?.text, { message: "ArrowRight did not walk the grid" })
			.not.toBe(firstDay?.text);

		await page.keyboard.press("Escape");
		await expect(page.locator("xtyle-popover[open]")).toHaveCount(0, { timeout: 10_000 });
		await expect
			.poll(async () => host.evaluate((el) => el.contains(document.activeElement)), {
				message: "closing the calendar left focus on nothing",
				timeout: 10_000,
			})
			.toBe(true);
	});
});

import { test, expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { listComponents } from "@xtyle/core";

/**
 * The engine suite cannot cover this: happy-dom does not fire the native `change` a real click
 * produces, so a component that echoes one looks clean there. Both defects this catches — a native
 * event reaching the host alongside the component's own, and a documented payload arriving empty —
 * are only visible against real browser semantics.
 *
 * **Assertions are per action, not per test.** A field mirroring the native `input`-then-`change`
 * contract emits its own event on commit while the inner control already fired a native one per
 * keystroke; those are two moments, and judging the whole interaction at once reads them as one event
 * sent twice. Driving one discrete action at a time is what keeps "two events for one action" a
 * defect rather than a false alarm, and it is what makes typing safe to exercise.
 *
 * A component no recipe provokes proves nothing, so every run records which actions were `exercised`
 * and which were `silent` rather than letting an empty result read as coverage.
 */
const NATIVE = ["input", "change", "select", "click"];

type Step = { label: string; run: (host: Locator, page: Page) => Promise<void> };

const clickFirst = (selector: string, label = "click"): Step => ({
	label,
	run: async (host) => {
		const target = host.locator(selector).first();
		if (await target.count()) await target.click({ timeout: 2500, force: true }).catch(() => {});
	},
});

const typeInto = (selector: string, text: string): Step => ({
	label: `type "${text}"`,
	run: async (host) => {
		const target = host.locator(selector).first();
		if (!(await target.count())) return;
		await target.click({ timeout: 2500 }).catch(() => {});
		await target.pressSequentially(text, { timeout: 2500 }).catch(() => {});
	},
});

const pressIn = (selector: string, key: string): Step => ({
	label: `press ${key}`,
	run: async (host) => {
		const target = host.locator(selector).first();
		if (await target.count()) await target.press(key, { timeout: 2500 }).catch(() => {});
	},
});

const clickNth = (selector: string, index: number, label: string): Step => ({
	label,
	run: async (host) => {
		const target = host.locator(selector).nth(index);
		if (await target.count()) await target.click({ timeout: 2500, force: true }).catch(() => {});
	},
});

const chord = (keys: string, label: string): Step => ({
	label,
	run: async (_host, page) => {
		await page.keyboard.press(keys).catch(() => {});
	},
});

/**
 * A crumb is a real link, so following it unloads the page before anything can be read back.
 *
 * Holding the links is still not enough to hear a `select`, and that is the component being right
 * rather than the recipe being wrong: a crumb given an `href` renders as an anchor and navigates,
 * while only a crumb without one renders as a button carrying `data-value` and reports a selection.
 * The reference demo trails are all links, so this one stays honestly silent.
 */
const holdTheLinks: Step = {
	label: "hold the links",
	run: async (_host, page) => {
		await page.evaluate(() => {
			document.addEventListener("click", (event) => {
				const link = (event.target as Element)?.closest?.("a[href]");
				if (link) event.preventDefault();
			});
		});
	},
};

const pressHost = (key: string): Step => ({
	label: `press ${key}`,
	run: async (host) => {
		await host.press(key, { timeout: 2500 }).catch(() => {});
	},
});

const DEFAULT: Step[] = [clickFirst("input:not([type=hidden]), button, [role=option]")];

/**
 * A decorator classes and wires markup the *consumer* wrote rather than drawing its own chrome, so a
 * native event out of that markup belongs to the author, not to the component. `table` declaring
 * `change` for its selection does not make a checkbox the author put in a row stop meaning what it
 * meant; silencing it would be the surprising choice. The payload still has to be right, so these are
 * exempt from the one-event rule and nothing else.
 */
const DECORATES_AUTHOR_MARKUP = new Set(["table"]);

type Recipe = Step[] | { host: string; steps: Step[] };

const RECIPES: Record<string, Recipe> = {
	field: [typeInto("input", "a")],
	textarea: [typeInto("textarea", "a")],
	"number-input": [typeInto("input", "4"), pressIn("input", "Enter"), clickFirst(".xtyle-number__step--inc", "step up")],
	"date-picker": [typeInto("input", "3"), pressIn("input", "Enter")],
	select: [
		{
			label: "choose an option",
			run: async (host) => {
				const native = host.locator("select").first();
				if (await native.count()) {
					const values = await native.locator("option").evaluateAll((nodes) =>
						nodes.map((node) => (node as HTMLOptionElement).value),
					);
					if (values[1] !== undefined) await native.selectOption(values[1]).catch(() => {});
				}
			},
		},
	],
	slider: [pressIn('[role="slider"]', "ArrowRight")],
	rating: { host: "xtyle-rating:not([readonly])", steps: [pressIn('[role="slider"]', "ArrowRight"), pressHost("ArrowRight")] },
	calendar: [clickFirst('[role="gridcell"]:not([aria-disabled="true"]) , td button', "pick a day")],
	tree: [clickFirst('[role="treeitem"]', "pick a node")],
	list: [clickFirst('[role="option"], li', "pick a row")],
	menu: [clickFirst('[role="menuitem"]', "pick an item")],
	breadcrumb: [holdTheLinks, clickFirst("[data-value]", "follow a crumb")],
	swatch: { host: "xtyle-swatch[interactive]", steps: [clickFirst("button", "pick a swatch")] },
	"theme-card": { host: "xtyle-theme-card[interactive]", steps: [clickFirst("button", "pick a card")] },
	bar: { host: "xtyle-bar[selectable]", steps: [clickFirst(".xtyle-bar__bar", "pick a bar")] },
	chart: { host: "xtyle-chart[selectable]", steps: [clickFirst(".xtyle-chart__point", "pick a point")] },
	heatmap: { host: "xtyle-heatmap[selectable]", steps: [clickFirst(".xtyle-heatmap__cell", "pick a cell")] },
	"bottom-nav": [clickNth(".xtyle-bottom-nav__item", 1, "pick a destination")],
	tabs: [clickFirst('[role="tab"]', "pick a tab")],
	segmented: [clickFirst('[role="radio"], button', "pick a segment")],
	"color-picker": [pressIn(".xtyle-color-picker__hue-handle", "ArrowRight")],
	combobox: [typeInto("input", "a")],
	markdown: {
		host: "xtyle-markdown[editable]",
		steps: [clickFirst("[data-toggle]", "show source"), typeInto("textarea", "a")],
	},
	bbcode: {
		host: "xtyle-bbcode[editable]",
		steps: [clickFirst("[data-toggle]", "show source"), typeInto("textarea", "a")],
	},
	"command-palette": {
		host: "xtyle-command-palette[hotkey]",
		steps: [chord("ControlOrMeta+k", "open it"), clickFirst('[role="option"]', "run a command")],
	},
	dropzone: [
		{
			label: "drop a file",
			run: async (host, page) => {
				const input = host.locator('input[type="file"]').first();
				if (await input.count())
					await input
						.setInputFiles({ name: "note.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") })
						.catch(() => {});
				await page.waitForTimeout(600);
			},
		},
	],
	table: { host: "xtyle-table[selection]", steps: [clickFirst('tbody input[type="checkbox"], tbody [role="checkbox"]', "select a row")] },
};

type Heard = { name: string; own: boolean; custom: boolean };

const probes = listComponents()
	.map((component) => {
		const events = (component.events ?? []).filter((event) => NATIVE.includes(event.name));
		return {
			id: component.id,
			names: events.map((event) => event.name),
			details: Object.fromEntries(
				events.filter((event) => event.detail).map((event) => [event.name, event.detail as string]),
			),
		};
	})
	.filter((probe) => probe.names.length > 0);

test.describe("events a real interaction produces", () => {
	for (const probe of probes) {
		test(probe.id, async ({ page }) => {
			const libraryComplaints: string[] = [];
			page.on("console", (msg) => {
				if (msg.text().startsWith("xtyle")) libraryComplaints.push(msg.text());
			});
			await page.goto(`/components/${probe.id}/`);
			const recipe = RECIPES[probe.id];
			const selector = Array.isArray(recipe) || !recipe ? `xtyle-${probe.id}` : recipe.host;
			const host = page.locator(selector).first();
			if (!(await host.count())) {
				test.info().annotations.push({
					type: "unreachable",
					description: `no "${selector}" on the page, so nothing was driven`,
				});
				return;
			}
			await page.waitForTimeout(300);

			await page.evaluate(
				({ selector, names }) => {
					const el = document.querySelector(selector);
					const store = window as unknown as { __heard: Heard[] };
					store.__heard = [];
					if (!el) return;
					for (const name of names) {
						el.addEventListener(name, (event) =>
							store.__heard.push({
								name,
								own: event.composedPath()[0] === el,
								custom: event instanceof CustomEvent && event.detail != null,
							}),
						);
					}
				},
				{ selector, names: probe.names },
			);

			const steps = !recipe ? DEFAULT : Array.isArray(recipe) ? recipe : recipe.steps;
			const exercised: string[] = [];

			for (const step of steps) {
				await page.evaluate(() => {
					(window as unknown as { __heard: Heard[] }).__heard = [];
				});
				await step.run(host, page);
				await page.waitForTimeout(150);
				const heard = await page.evaluate(
					() => (window as unknown as { __heard: Heard[] }).__heard,
				);
				if (!heard.length) continue;
				exercised.push(`${step.label}: ${heard.map((h) => `${h.name}:${h.own ? "own" : "native"}`).join(" ")}`);

				for (const name of probe.names) {
					const forName = heard.filter((entry) => entry.name === name);
					const own = forName.filter((entry) => entry.own);
					const native = forName.filter((entry) => !entry.own);

					expect(
						own.length > 0 && native.length > 0 && !DECORATES_AUTHOR_MARKUP.has(probe.id),
						`<xtyle-${probe.id}> emitted its own "${name}" and let the native one through too, ` +
							`for a single action (${step.label}) — a consumer hears ${forName.length} events for one.`,
					).toBe(false);

					expect(
						own.length,
						`<xtyle-${probe.id}> emitted "${name}" ${own.length} times for a single action ` +
							`(${step.label}); one action should produce one event.`,
					).toBeLessThanOrEqual(1);

					const documented = probe.details[name];
					if (documented && own.length > 0) {
						expect(
							own[0]!.custom,
							`<xtyle-${probe.id}> documents "${name}" as carrying ${documented}, ` +
								`but the event it dispatched on ${step.label} has no detail.`,
						).toBe(true);
					}
				}
			}

			test.info().annotations.push({
				type: exercised.length ? "exercised" : "silent",
				description: exercised.length
					? exercised.join(" · ")
					: `no ${probe.names.join("/")} provoked by ${steps.length} step(s)`,
			});

			expect(
				[...new Set(libraryComplaints)],
				`<xtyle-${probe.id}> complained about its own usage while being driven`,
			).toEqual([]);
		});
	}
});

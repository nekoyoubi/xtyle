import { test, expect } from "@playwright/test";
import { listComponents } from "@xtyle/core";
import { COMPONENTS } from "./lib/components.ts";
import { SCENES } from "../../../apps/site/src/components/bench/view.ts";
import { themeEnvelope } from "./lib/theme.ts";
import { waitForTheme } from "./lib/page.ts";

const PASSTHROUGH = new Set([
	"accesskey",
	"autocapitalize",
	"autofocus",
	"class",
	"contenteditable",
	"dir",
	"draggable",
	"enterkeyhint",
	"hidden",
	"id",
	"inert",
	"inputmode",
	"is",
	"itemid",
	"itemprop",
	"itemref",
	"itemscope",
	"itemtype",
	"lang",
	"nonce",
	"part",
	"popover",
	"role",
	"slot",
	"spellcheck",
	"style",
	"tabindex",
	"title",
	"translate",
]);

const kebab = (name: string): string => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

const vocabulary = new Map<string, Set<string>>(
	listComponents().map((manifest) => {
		const names = new Set(PASSTHROUGH);
		for (const prop of manifest.props) {
			names.add(kebab(prop.name));
			if (prop.attr) names.add(prop.attr);
			for (const alias of prop.aliases ?? []) names.add(alias.toLowerCase());
		}
		if (manifest.variants.length) names.add("variant");
		if (manifest.sizes.length) names.add("size");
		return [`xtyle-${manifest.id}`, names];
	}),
);

const openValueSpace = (type: string | undefined): boolean => /\bstring(\[\])?\b/.test(type ?? "");

const optionSets = new Map<string, Map<string, Set<string>>>();
for (const manifest of listComponents()) {
	for (const prop of manifest.props) {
		if (!prop.options?.length || openValueSpace(prop.type)) continue;
		const tag = prop.attrOn ?? `xtyle-${manifest.id}`;
		const allowed = new Set(prop.options.map(String));
		const byAttr = optionSets.get(tag) ?? new Map<string, Set<string>>();
		for (const name of [kebab(prop.name), prop.attr, ...(prop.aliases ?? [])]) {
			if (name) byAttr.set(name.toLowerCase(), allowed);
		}
		optionSets.set(tag, byAttr);
	}
}

const ignorable = (name: string): boolean =>
	name === "/" || name.startsWith("data-") || name.startsWith("aria-") || name.startsWith("on");

function strayAttributes(html: string): string[] {
	const stray: string[] = [];
	for (const element of html.matchAll(/<(xtyle-[a-z-]+)((?:\s+[^\s=>]+(?:="[^"]*")?)*)\s*\/?>/g)) {
		const names = vocabulary.get(element[1]);
		if (!names) continue;
		for (const attribute of element[2].matchAll(/([^\s=]+)(?:="[^"]*")?/g)) {
			const name = attribute[1].toLowerCase();
			if (!name || ignorable(name) || names.has(name)) continue;
			stray.push(`<${element[1]} ${name}>`);
		}
	}
	return [...new Set(stray)];
}

function strayValues(html: string): string[] {
	const stray: string[] = [];
	for (const element of html.matchAll(/<(xtyle-[a-z-]+)((?:\s+[^\s=>]+(?:="[^"]*")?)*)\s*\/?>/g)) {
		const byAttr = optionSets.get(element[1]);
		if (!byAttr) continue;
		for (const attribute of element[2].matchAll(/([^\s=]+)="([^"]*)"/g)) {
			const allowed = byAttr.get(attribute[1].toLowerCase());
			if (!allowed || attribute[2] === "" || allowed.has(attribute[2])) continue;
			stray.push(`<${element[1]} ${attribute[1]}="${attribute[2]}"> — expected ${[...allowed].join(" | ")}`);
		}
	}
	return [...new Set(stray)];
}

test.describe("a reference page passes only props its component documents", () => {
	for (const id of COMPONENTS) {
		test(id, async ({ request }) => {
			const response = await request.get(`/components/${id}/`);
			expect(response.ok(), `/components/${id}/ did not respond`).toBe(true);
			const html = await response.text();
			expect(strayAttributes(html)).toEqual([]);
			expect(strayValues(html)).toEqual([]);
		});
	}
});

test.describe("a bench mockup passes only props its component documents", () => {
	const allowed = [...vocabulary].map(([tag, names]) => [tag, [...names]] as const);
	const sets = [...optionSets].map(
		([tag, byAttr]) => [tag, [...byAttr].map(([attr, values]) => [attr, [...values]] as const)] as const,
	);

	for (const { value: scene } of SCENES.mockups ?? []) {
		test(`mockups/${scene}`, async ({ page, context }) => {
			await context.addInitScript((envJson: string) => {
				localStorage.setItem("xtyle.themes.v1", envJson);
			}, themeEnvelope("xtyle-default"));

			await page.goto(`/bench/themes?view=mockups&scene=${scene}`, { waitUntil: "domcontentloaded" });
			await waitForTheme(page);
			await expect(page.locator(`[data-scene="${scene}"]`)).toBeVisible({ timeout: 90_000 });

			const stray = await page.evaluate((entries: (readonly [string, string[]])[]) => {
				const names = new Map(entries.map(([tag, list]) => [tag, new Set(list)]));
				const found = new Set<string>();
				for (const element of document.querySelectorAll("[data-scene] *")) {
					const tag = element.tagName.toLowerCase();
					const known = names.get(tag);
					if (!known) continue;
					for (const attribute of element.attributes) {
						const name = attribute.name.toLowerCase();
						if (name.startsWith("data-") || name.startsWith("aria-") || name.startsWith("on")) continue;
						if (known.has(name)) continue;
						found.add(`<${tag} ${name}>`);
					}
				}
				return [...found];
			}, allowed);

			expect(stray).toEqual([]);

			const wrong = await page.evaluate((entries: (readonly [string, (readonly [string, string[]])[]])[]) => {
				const sets = new Map(entries.map(([tag, list]) => [tag, new Map(list.map(([a, v]) => [a, new Set(v)]))]));
				const found = new Set<string>();
				for (const element of document.querySelectorAll("[data-scene] *")) {
					const byAttr = sets.get(element.tagName.toLowerCase());
					if (!byAttr) continue;
					for (const attribute of element.attributes) {
						const allowed = byAttr.get(attribute.name.toLowerCase());
						if (!allowed || attribute.value === "" || allowed.has(attribute.value)) continue;
						found.add(
							`<${element.tagName.toLowerCase()} ${attribute.name}="${attribute.value}"> — expected ${[...allowed].join(" | ")}`,
						);
					}
				}
				return [...found];
			}, sets);

			expect(wrong).toEqual([]);
		});
	}
});

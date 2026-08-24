// @vitest-environment happy-dom
import { beforeAll, describe, expect, it } from "vitest";
import "../src/elements/index.js";
import { loadFill } from "../src/elements/fragment-host.js";

import * as menuFill from "../src/elements/fragments/menu/source.generated.js";
import * as tabsFill from "../src/elements/fragments/tabs/source.generated.js";
import * as treeFill from "../src/elements/fragments/tree/source.generated.js";
import * as listFill from "../src/elements/fragments/list/source.generated.js";
import * as breadcrumbFill from "../src/elements/fragments/breadcrumb/source.generated.js";

type Case = {
	tag: string;
	fill: { manifest: unknown; fragmentSources: Record<string, string> };
	attrs?: Record<string, string>;
	items: (labels: string[]) => unknown[];
};

const CASES: Case[] = [
	{
		tag: "xtyle-menu",
		fill: menuFill,
		attrs: { label: "Actions" },
		items: (labels) => labels.map((label) => ({ label, value: label.toLowerCase() })),
	},
	{
		tag: "xtyle-tabs",
		fill: tabsFill,
		attrs: { label: "Sections" },
		items: (labels) => labels.map((label) => ({ label, value: label.toLowerCase(), panel: `${label} body` })),
	},
	{
		tag: "xtyle-tree",
		fill: treeFill,
		attrs: { label: "Files" },
		items: (labels) => labels.map((label) => ({ label, value: label.toLowerCase() })),
	},
	{
		tag: "xtyle-list",
		fill: listFill,
		items: (labels) => labels.map((label) => ({ label, value: label.toLowerCase() })),
	},
	{
		tag: "xtyle-breadcrumb",
		fill: breadcrumbFill,
		items: (labels) => labels.map((label) => ({ label, href: `/${label.toLowerCase()}` })),
	},
];

beforeAll(async () => {
	for (const c of CASES) await loadFill(c.fill.manifest as never, c.fill.fragmentSources);
});

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const painted = (el: HTMLElement): string =>
	`${el.shadowRoot?.textContent ?? ""} ${el.textContent ?? ""}`;

describe("a collection element repaints when its item set changes", () => {
	for (const c of CASES) {
		it(`${c.tag} drops the old labels and paints the new ones`, async () => {
			const el = document.createElement(c.tag) as HTMLElement & { items: unknown };
			for (const [name, value] of Object.entries(c.attrs ?? {})) el.setAttribute(name, value);
			const writable = Boolean(
				Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "items")?.set,
			);
			const give = (labels: string[]) => {
				if (writable) el.items = c.items(labels);
				else el.setAttribute("items", JSON.stringify(c.items(labels)));
			};

			give(["Alpha", "Beta"]);
			document.body.appendChild(el);
			await settle();
			await settle();

			expect(painted(el), `${c.tag} never painted its first item set`).toContain("Alpha");

			give(["Gamma", "Delta"]);
			await settle();
			await settle();

			const after = painted(el);
			expect(after, `${c.tag} did not paint the replacement items`).toContain("Gamma");
			expect(after, `${c.tag} kept a label from the item set it was told to forget`).not.toContain("Alpha");

			el.remove();
		});
	}
});

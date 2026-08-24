// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/splitter.js";
import "../src/elements/pagination.js";
import "../src/elements/redact.js";
import "../src/elements/list.js";
import "../src/elements/tree.js";
import { loadFill } from "../src/elements/fragment-host.js";
import * as splitterFragment from "../src/elements/fragments/splitter/source.generated.js";
import * as paginationFragment from "../src/elements/fragments/pagination/source.generated.js";
import * as redactFragment from "../src/elements/fragments/redact/source.generated.js";
import * as listFragment from "../src/elements/fragments/list/source.generated.js";
import * as treeFragment from "../src/elements/fragments/tree/source.generated.js";

beforeAll(async () => {
	await loadFill(splitterFragment.manifest, splitterFragment.fragmentSources);
	await loadFill(paginationFragment.manifest, paginationFragment.fragmentSources);
	await loadFill(redactFragment.manifest, redactFragment.fragmentSources);
	await loadFill(listFragment.manifest, listFragment.fragmentSources);
	await loadFill(treeFragment.manifest, treeFragment.fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/** The keyboard route is wired on the handle the fragment renders, not on the host. */
function nudge(el: HTMLElement): void {
	const handle = (el.shadowRoot ?? el).querySelector<HTMLElement>(".xtyle-splitter");
	handle?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
}

async function mount<T extends HTMLElement>(html: string): Promise<T> {
	document.body.innerHTML = html;
	const el = document.body.firstElementChild as T;
	await settle();
	return el;
}

describe("splitter's settle event", () => {
	it("dispatches under the name its manifest declares", async () => {
		const el = await mount<HTMLElement & { value: number }>(
			`<xtyle-splitter label="rail" value="200" min="0" max="400" step="10"></xtyle-splitter>`,
		);
		const seen: Array<{ value: number; orientation: string }> = [];
		el.addEventListener("resize-end", (e) => seen.push((e as CustomEvent).detail));

		nudge(el);
		await settle();

		expect(seen.length, "a keyboard nudge should settle the split").toBeGreaterThan(0);
		expect(seen[0]).toHaveProperty("value");
		expect(seen[0]).toHaveProperty("orientation");
	});

	it("carries the payload the manifest documents, not a position", async () => {
		const el = await mount<HTMLElement & { value: number }>(
			`<xtyle-splitter label="rail" value="200" min="0" max="400" step="10"></xtyle-splitter>`,
		);
		let detail: Record<string, unknown> | null = null;
		el.addEventListener("resize-end", (e) => {
			detail = (e as CustomEvent).detail;
		});

		nudge(el);
		await settle();

		expect(detail).not.toBeNull();
		expect(Object.keys(detail ?? {}).sort()).toEqual(["orientation", "value"]);
	});

	it("does not answer the name the manifest used to claim", async () => {
		const el = await mount<HTMLElement>(
			`<xtyle-splitter label="rail" value="200" min="0" max="400" step="10"></xtyle-splitter>`,
		);
		let fired = false;
		el.addEventListener("resizeend", () => {
			fired = true;
		});

		nudge(el);
		await settle();

		expect(fired, "the unhyphenated name was never dispatched; nothing should resurrect it").toBe(false);
	});
});

describe("pagination's page-change", () => {
	it("reports the page a control activated", async () => {
		const el = await mount<HTMLElement>(`<xtyle-pagination page="2" total="9"></xtyle-pagination>`);
		const pages: number[] = [];
		el.addEventListener("page-change", (e) => pages.push((e as CustomEvent).detail.page));

		const target = (el.shadowRoot ?? el).querySelector<HTMLElement>('[data-page="4"]');
		expect(target, "the fragment should have rendered a control for page 4").not.toBeNull();
		target?.click();
		await settle();

		expect(pages).toContain(4);
	});
});

describe("redact's conceal", () => {
	it("fires when covered content is put back", async () => {
		const el = await mount<HTMLElement & { revealed: boolean }>(
			`<xtyle-redact revealed>secret</xtyle-redact>`,
		);
		let concealed = 0;
		el.addEventListener("conceal", () => {
			concealed++;
		});

		el.revealed = false;
		await settle();

		expect(concealed).toBe(1);
	});
});

describe("the collection substrate's per-item action events", () => {
	it("list reports which action fired on which item", async () => {
		const el = await mount<HTMLElement & { items: unknown }>(
			`<xtyle-list interaction="actionable" label="files"></xtyle-list>`,
		);
		el.items = [{ label: "One", value: "one", actions: [{ id: "del", label: "Delete" }] }];
		await settle();

		const seen: Array<{ value: string; action: string }> = [];
		el.addEventListener("list-action", (e) => seen.push((e as CustomEvent).detail));

		const button = (el.shadowRoot ?? el).querySelector<HTMLElement>('[data-action="del"]');
		expect(button, "the actionable posture should render the action button").not.toBeNull();
		button?.click();
		await settle();

		expect(seen).toEqual([{ value: "one", action: "del" }]);
	});

	it("tree reports which action fired on which node", async () => {
		const el = await mount<HTMLElement & { items: unknown }>(`<xtyle-tree label="places"></xtyle-tree>`);
		el.items = [{ label: "Root", value: "root", actions: [{ id: "rename", label: "Rename" }] }];
		await settle();

		const seen: Array<{ value: string; action: string }> = [];
		el.addEventListener("tree-action", (e) => seen.push((e as CustomEvent).detail));

		const button = (el.shadowRoot ?? el).querySelector<HTMLElement>('[data-action="rename"]');
		expect(button, "a non-link node should render its trailing actions").not.toBeNull();
		button?.click();
		await settle();

		expect(seen).toEqual([{ value: "root", action: "rename" }]);
	});
});

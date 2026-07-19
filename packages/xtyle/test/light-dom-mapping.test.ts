// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { hasComposedScaffold } from "../src/elements/base.js";
import { loadFill } from "../src/elements/fragment-host.js";
import "../src/elements/tour.js";
import "../src/elements/segmented.js";
import { manifest, fragmentSources } from "../src/elements/fragments/segmented/source.generated.js";

const elementsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "elements");

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});
afterEach(() => {
	document.body.innerHTML = "";
});

/**
 * `:scope >` is unsupported in the DOM implementation these tests run against — it matches nothing,
 * including direct children that plainly qualify. Every light-DOM child mapping written that way is
 * therefore invisible to this suite: it returns an empty set here and a correct one in a browser, so
 * a broken mapping still passes. That is how a slotted-mode bug once shipped green. Map direct
 * children by filtering `this.children` instead.
 */
describe("light-DOM child mapping", () => {
	it("happy-dom really does fail `:scope >`, which is why the guard below exists", () => {
		const host = document.createElement("div");
		host.innerHTML = '<span data-marker="x">a</span>';
		document.body.appendChild(host);
		expect(host.querySelectorAll("[data-marker]")).toHaveLength(1);
		expect(host.querySelectorAll(":scope > [data-marker]")).toHaveLength(0);
	});

	it("no element maps its light-DOM children through `:scope >`", () => {
		const offenders: string[] = [];
		for (const file of readdirSync(elementsDir).filter((f) => f.endsWith(".ts"))) {
			const src = readFileSync(join(elementsDir, file), "utf8");
			for (const line of src.split("\n")) {
				if (/querySelector(All)?\s*(<[^>]*>)?\s*\(\s*["'`]:scope >/.test(line)) offenders.push(`${file}: ${line.trim()}`);
			}
		}
		expect(offenders, `these mappings are untestable and may silently match nothing:\n${offenders.join("\n")}`).toEqual(
			[],
		);
	});
});

describe("<xtyle-tour> step mapping", () => {
	it("reads its direct `<xtyle-tour-step>` children", () => {
		const el = document.createElement("xtyle-tour") as HTMLElement & { steps: HTMLElement[] };
		el.setAttribute("label", "Product tour");
		el.innerHTML = `
			<xtyle-tour-step target="#a">First</xtyle-tour-step>
			<xtyle-tour-step target="#b">Second</xtyle-tour-step>`;
		document.body.appendChild(el);
		expect(el.steps).toHaveLength(2);
		expect(el.steps.map((s) => s.getAttribute("target"))).toEqual(["#a", "#b"]);
	});

	it("ignores a nested step that belongs to an inner tour", () => {
		const el = document.createElement("xtyle-tour") as HTMLElement & { steps: HTMLElement[] };
		el.setAttribute("label", "Product tour");
		el.innerHTML = `
			<xtyle-tour-step target="#a">First</xtyle-tour-step>
			<div><xtyle-tour-step target="#nested">Not mine</xtyle-tour-step></div>`;
		document.body.appendChild(el);
		expect(el.steps.map((s) => s.getAttribute("target"))).toEqual(["#a"]);
	});
});

describe("<xtyle-segmented> light-DOM segments", () => {
	function mount(children: string): HTMLElement {
		const el = document.createElement("xtyle-segmented");
		el.setAttribute("label", "View");
		el.innerHTML = children;
		document.body.appendChild(el);
		return el;
	}
	function values(el: HTMLElement): (string | null)[] {
		const root = el.shadowRoot as ShadowRoot;
		return Array.from(root.querySelectorAll<HTMLElement>('[role="radio"]')).map((s) => s.getAttribute("data-value"));
	}

	const segments = `
		<span slot="segment" value="grid">Grid</span>
		<span slot="segment" value="list">List</span>`;

	it("maps `slot=\"segment\"` children into rendered segments", () => {
		expect(values(mount(segments))).toEqual(["grid", "list"]);
	});

	it("keeps mapping them after the element reindexes their slots", () => {
		const el = mount(segments);
		el.setAttribute("value", "list");
		expect(values(el)).toEqual(["grid", "list"]);
	});
});

/**
 * `auto` mode picks light vs shadow by asking `hasComposedScaffold` whether the element is upgrading
 * over SSR-composed markup. The decision itself is asserted here rather than through a real upgrade:
 * happy-dom hands the constructor an element with *no* children even when the markup has them, so
 * every element resolves to shadow in this environment and an upgrade-based test would pass no
 * matter what the predicate did. Exercising the predicate keeps the assertion honest.
 */
describe("hasComposedScaffold", () => {
	function host(inner: string): HTMLElement {
		const el = document.createElement("div");
		el.innerHTML = inner;
		document.body.appendChild(el);
		return el;
	}

	it("finds a scaffold that is a direct child", () => {
		expect(hasComposedScaffold(host('<div data-root="">composed</div>'))).toBe(true);
	});

	it("reports none when the element is bare", () => {
		expect(hasComposedScaffold(host(""))).toBe(false);
	});

	it("does not mistake a nested component's scaffold for its own", () => {
		expect(hasComposedScaffold(host('<section><div data-root="">inner component</div></section>'))).toBe(false);
	});

	it("still finds the scaffold when the consumer's own markup precedes it", () => {
		expect(hasComposedScaffold(host('<span>label</span><div data-root="">composed</div>'))).toBe(true);
	});
});

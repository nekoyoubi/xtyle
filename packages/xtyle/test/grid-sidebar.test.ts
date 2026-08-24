// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/grid.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/grid/source.generated.js";
import { componentsCss } from "../src/css/index.js";
import { getComponent } from "../src/index.js";

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function mount(attributes: Record<string, string>): HTMLElement {
	const element = document.createElement("xtyle-grid");
	for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
	document.body.append(element);
	return element.querySelector<HTMLElement>(".xtyle-grid") ?? element.shadowRoot!.querySelector(".xtyle-grid")!;
}

describe("the sidebar shell is a third sizing mode, not a third meaning for an existing prop", () => {
	it("puts the rail last by default and hands the remainder to what precedes it", () => {
		const grid = mount({ sidebar: "18rem" });
		expect(grid.className).toContain("xtyle-grid--sidebar");
		expect(grid.className).toContain("xtyle-grid--sidebar-end");
		expect(grid.getAttribute("style")).toContain("--xtyle-grid-rail: 18rem");
	});

	it("moves the rail to the first track on side=start without touching source order", () => {
		const grid = mount({ sidebar: "12rem", side: "start" });
		expect(grid.className).toContain("xtyle-grid--sidebar-start");
		expect(grid.className).not.toContain("xtyle-grid--sidebar-end");
	});

	it("falls back to the trailing rail for a side outside the vocabulary", () => {
		const grid = mount({ sidebar: "12rem", side: "leading" });
		expect(grid.className).toContain("xtyle-grid--sidebar-end");
	});

	it("reads minColWidth as the main column's floor rather than an auto-fit track", () => {
		const grid = mount({ sidebar: "18rem", "min-col-width": "22rem" });
		const style = grid.getAttribute("style") ?? "";
		expect(style).toContain("--xtyle-grid-main: 22rem");
		expect(style).not.toContain("auto-fit");
	});

	it("never stacks when no floor is given, which is the honest default for an unknown payload", () => {
		const grid = mount({ sidebar: "18rem" });
		expect(grid.getAttribute("style")).not.toContain("--xtyle-grid-main");
	});

	it("outranks both of the uniform modes rather than competing with them", () => {
		const grid = mount({ sidebar: "18rem", columns: "3", "min-col-width": "22rem" });
		expect(grid.className).not.toContain("xtyle-grid--cols-");
		expect(grid.getAttribute("style")).not.toContain("grid-template-columns");
	});

	it("stays out of the way entirely when the width is empty or blank", () => {
		for (const sidebar of ["", "   "]) {
			const grid = mount({ sidebar, columns: "3" });
			expect(grid.className).not.toContain("xtyle-grid--sidebar");
			expect(grid.className).toContain("xtyle-grid--cols-3");
			document.body.innerHTML = "";
		}
	});

	it("leaves the uniform modes exactly as they were", () => {
		expect(mount({ columns: "4" }).className).toContain("xtyle-grid--cols-4");
		document.body.innerHTML = "";
		expect(mount({ "min-col-width": "16rem" }).getAttribute("style")).toContain(
			"grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr))",
		);
	});
});

describe("a width that arrives from the page stays inside the style attribute it lands in", () => {
	const hostile = '1rem" onmouseover="alert(1)';

	it.each(["sidebar", "min-col-width"])("keeps a quote-bearing %s whole rather than truncating it", (attribute) => {
		const grid = mount({ [attribute]: hostile });
		expect(grid.getAttribute("style")).toContain(hostile);
		expect(grid.hasAttribute("onmouseover")).toBe(false);
	});
});

describe("both render modes reach the two tracks, and neither reaches the other's", () => {
	const rules = componentsCss;

	it.each([
		[".xtyle-grid--sidebar > *", "the light-DOM main column"],
		[".xtyle-grid--sidebar ::slotted(*)", "the shadow-DOM main column"],
		[".xtyle-grid--sidebar-end > *:last-child", "the light-DOM trailing rail"],
		[".xtyle-grid--sidebar-end ::slotted(*:last-child)", "the shadow-DOM trailing rail"],
		[".xtyle-grid--sidebar-start > *:first-child", "the light-DOM leading rail"],
		[".xtyle-grid--sidebar-start ::slotted(*:first-child)", "the shadow-DOM leading rail"],
	])("styles %s — %s", (selector) => {
		expect(rules).toContain(selector);
	});

	it("wraps rather than overflowing, since grid cannot reflow a fixed track onto its own row", () => {
		const block = rules.slice(rules.indexOf(".xtyle-grid--sidebar {"));
		expect(block.slice(0, 120)).toContain("flex-wrap: wrap");
	});

	it("lets the rail grow once it is alone on its line, so a stacked rail is not a stranded column", () => {
		expect(rules).toContain("flex: 1 1 var(--xtyle-grid-rail");
	});

	it("keeps inline grids inline when they take a rail", () => {
		expect(rules).toContain(".xtyle-grid--sidebar.xtyle-grid--inline");
	});

	it("lets the floor yield to a container narrower than it, so a stacked pair does not overflow", () => {
		expect(rules).toContain("min-inline-size: min(var(--xtyle-grid-main, 0px), 100%)");
	});
});

describe("the manifest documents the mode a consumer builds against", () => {
	const grid = getComponent("grid");

	it("declares both props across all three bindings", () => {
		for (const name of ["sidebar", "side"]) {
			const prop = (grid.props ?? []).find((p) => p.name === name);
			expect(prop, `grid is missing the \`${name}\` prop`).toBeDefined();
			expect(prop?.bindings).toEqual(["html", "svelte", "astro"]);
		}
	});

	it("says which child the rail is by default", () => {
		expect((grid.props ?? []).find((p) => p.name === "side")?.default).toBe("end");
	});

	it("warns that justify is inert in the mode, rather than leaving it to be discovered", () => {
		expect((grid.props ?? []).find((p) => p.name === "justify")?.description).toContain("sidebar");
	});

	it("ships a worked example, not just a prop row", () => {
		const example = grid.examples.find((e) => e.id === "sidebar-shell");
		expect(example).toBeDefined();
		for (const source of Object.values(example?.source ?? {})) expect(source).toContain("sidebar");
	});
});

import { describe, expect, it } from "vitest";
import { markedChildren, markedPairs, topLevelElements, renderFragmentLight } from "../src/elements/fragment-ssr.js";

describe("markedChildren", () => {
	it("finds top-level children by marker, in document order", () => {
		const found = markedChildren(
			`<span data-xtyle-header>One</span><div data-xtyle-panel>Body</div><span data-xtyle-header>Two</span>`,
			["header", "panel"],
		);
		expect(found.map((c) => c.marker)).toEqual(["header", "panel", "header"]);
		expect(found.map((c) => c.html)).toEqual(["One", "Body", "Two"]);
	});

	it("keeps a nested component's markup intact rather than flattening it to text", () => {
		const [child] = markedChildren(`<div data-xtyle-panel><xtyle-stack><p>Deep</p></xtyle-stack></div>`, ["panel"]);
		expect(child?.html).toBe("<xtyle-stack><p>Deep</p></xtyle-stack>");
	});

	it("ignores a marker that appears on a descendant rather than a top-level child", () => {
		const found = markedChildren(`<div data-xtyle-panel><span data-xtyle-header>Inner</span></div>`, [
			"header",
			"panel",
		]);
		expect(found.map((c) => c.marker)).toEqual(["panel"]);
	});

	it("reads the attributes the binding keys identity and state off", () => {
		const [child] = markedChildren(`<span data-xtyle-header data-value="ship" aria-expanded="true">H</span>`, [
			"header",
		]);
		expect(child?.attrs["data-value"]).toBe("ship");
		expect(child?.attrs["aria-expanded"]).toBe("true");
	});

	it("drops unmarked children, matching the element's refusal to pair what it cannot identify", () => {
		const found = markedChildren(`<hr><span data-xtyle-header>One</span><p>stray</p>`, ["header"]);
		expect(found).toHaveLength(1);
	});

	it("takes a marked void child as a childless one rather than stalling on its missing end tag", () => {
		const found = markedChildren(`<img data-xtyle-panel src="a.png"><span data-xtyle-header>After</span>`, [
			"header",
			"panel",
		]);
		expect(found.map((c) => c.marker)).toEqual(["panel", "header"]);
		expect(found[0]?.html).toBe("");
		expect(found[1]?.html).toBe("After");
	});
});

describe("markedPairs", () => {
	it("pairs a lead with the body that follows it", () => {
		const pairs = markedPairs(
			`<span data-xtyle-header>One</span><div data-xtyle-panel>A</div>` +
				`<span data-xtyle-header>Two</span><div data-xtyle-panel>B</div>`,
			"header",
			"panel",
		);
		expect(pairs.map((p) => [p.lead.html, p.body?.html])).toEqual([
			["One", "A"],
			["Two", "B"],
		]);
	});

	it("yields a bodyless pair rather than dropping a lead with no panel after it", () => {
		const pairs = markedPairs(`<span data-xtyle-header>Lonely</span>`, "header", "panel");
		expect(pairs).toHaveLength(1);
		expect(pairs[0]?.body).toBeNull();
	});

	it("does not let a second panel steal the next lead's slot", () => {
		const pairs = markedPairs(
			`<span data-xtyle-header>One</span><div data-xtyle-panel>A</div><div data-xtyle-panel>orphan</div>` +
				`<span data-xtyle-header>Two</span><div data-xtyle-panel>B</div>`,
			"header",
			"panel",
		);
		expect(pairs.map((p) => [p.lead.html, p.body?.html])).toEqual([
			["One", "A"],
			["Two", "B"],
		]);
	});
});

describe("topLevelElements", () => {
	it("splits the legacy grouped named-slot shape into one entry per child", () => {
		const found = topLevelElements(`<span value="a">Alpha</span><span value="b">Beta</span>`);
		expect(found.map((c) => c.html)).toEqual(["Alpha", "Beta"]);
		expect(found.map((c) => c.attrs.value)).toEqual(["a", "b"]);
	});

	it("treats a wrapper as one element, not its children", () => {
		expect(topLevelElements(`<div><span>a</span><span>b</span></div>`)).toHaveLength(1);
	});

	it("skips a hoisted script so it cannot pose as an authored child", () => {
		const found = topLevelElements(
			`<script type="module" src="/@fs/Code.astro?astro&type=script&index=0"></script>` +
				`<div data-binding="html">A</div><div data-binding="svelte">B</div>`,
		);
		expect(found.map((c) => c.attrs["data-binding"])).toEqual(["html", "svelte"]);
	});

	it("skips a hoisted style the same way", () => {
		expect(topLevelElements(`<style>.a{color:red}</style><p>only</p>`).map((c) => c.name)).toEqual(["p"]);
	});

	it("still reports the tag name of the children it keeps", () => {
		expect(topLevelElements(`<span>a</span><div>b</div>`).map((c) => c.name)).toEqual(["span", "div"]);
	});

	it("counts a void child as one entry instead of swallowing its siblings", () => {
		const found = topLevelElements(`<img src="a.png"><div>after</div>`);
		expect(found.map((c) => c.name)).toEqual(["img", "div"]);
		expect(found[0]?.attrs.src).toBe("a.png");
		expect(found[0]?.html).toBe("");
	});

	it("skips a void non-rendering element without stalling on it", () => {
		expect(topLevelElements(`<link rel="stylesheet" href="a.css"><p>only</p>`).map((c) => c.name)).toEqual(["p"]);
	});
});

/** Reproduce what the Astro binding does end-to-end, so a regression in either half is caught here
 * rather than only showing up as a blank component in a built site. */
async function composeAccordion(slotHtml: string) {
	const authored = markedPairs(slotHtml, "header", "panel");
	const sections = authored.map((p, i) => ({
		header: "",
		headerSlot: `header-${i}`,
		panel: "",
		panelSlot: `panel-${i}`,
		value: p.lead.attrs["data-value"] ?? String(i),
		open: p.lead.attrs["aria-expanded"] === "true",
	}));
	const light = await renderFragmentLight("accordion", {
		sections,
		openKeys: sections.filter((s) => s.open).map((s) => s.value),
		size: "md",
		uid: "u",
	});
	return authored.reduce(
		(html, p, i) =>
			html
				.replace(`<slot name="header-${i}"></slot>`, () => p.lead.html)
				.replace(`<slot name="panel-${i}"></slot>`, () => p.body?.html ?? ""),
		light,
	);
}

describe("slotted accordion, composed server-side", () => {
	const slotHtml =
		`<span data-xtyle-header data-value="ship"><xtyle-icon name="gear"></xtyle-icon> Ships <b>fast</b></span>` +
		`<div data-xtyle-panel><xtyle-stack><p>Nested</p></xtyle-stack></div>` +
		`<span data-xtyle-header aria-expanded="true">Returns</span>` +
		`<div data-xtyle-panel>Thirty days.</div>`;

	it("renders the full trigger/panel structure, not an empty box", async () => {
		const html = await composeAccordion(slotHtml);
		expect(html.match(/class="xtyle-accordion__trigger"/g)).toHaveLength(2);
		expect(html.match(/class="xtyle-accordion__panel"/g)).toHaveLength(2);
	});

	it("keeps header markup live instead of escaping it to visible text", async () => {
		const html = await composeAccordion(slotHtml);
		expect(html).toContain('<xtyle-icon name="gear"></xtyle-icon> Ships <b>fast</b>');
		expect(html).not.toContain("&lt;b&gt;");
	});

	it("carries a nested component through into the panel", async () => {
		expect(await composeAccordion(slotHtml)).toContain("<xtyle-stack><p>Nested</p></xtyle-stack>");
	});

	it("takes the section key from `data-value` so SSR and runtime agree on identity", async () => {
		expect(await composeAccordion(slotHtml)).toContain('data-key="ship"');
	});

	it("honors the authored open state, collapsing the closed section with no script", async () => {
		const html = await composeAccordion(slotHtml);
		expect(html).toMatch(/<details[^>]*data-key="ship"(?![^>]*\sopen)/);
		expect(html).toMatch(/<details[^>]*data-key="1"[^>]*\sopen/);
		expect(html).not.toMatch(/class="xtyle-accordion__panel"[^>]*\shidden/);
	});

	it("leaves the `data-slot` regions standing so the element can adopt them on upgrade", async () => {
		const html = await composeAccordion(slotHtml);
		expect(html).toContain('data-slot="header-0"');
		expect(html).toContain('data-slot="panel-0"');
	});
});

/** The legacy named-slot half of the same binding: the framework hands back one string per role and
 * the two are zipped positionally, so anything counted that the author did not write misaligns them. */
async function composeTabs(tabSlotHtml: string, panelSlotHtml: string) {
	const leads = topLevelElements(tabSlotHtml);
	const bodies = topLevelElements(panelSlotHtml);
	const authored = leads.map((lead, i) => ({ lead, body: bodies[i] ?? null }));
	const tabs = authored.map(({ lead }, i) => ({
		key: lead.attrs["data-value"] ?? lead.attrs.value ?? String(i),
		label: "",
		labelSlot: `label-${i}`,
		panelSlot: `panel-${i}`,
		panel: "",
		disabled: false,
	}));
	const light = await renderFragmentLight("tabs", {
		tabs,
		activeId: tabs[0]?.key ?? null,
		variant: "underline",
		size: "md",
		sticky: false,
		tablist: false,
		label: "Code by binding",
		labelledby: null,
		uid: "u",
	});
	return authored.reduce(
		(html, pair, i) =>
			html
				.replace(`<slot name="label-${i}"></slot>`, () => pair.lead.html)
				.replace(`<slot name="panel-${i}"></slot>`, () => pair.body?.html ?? ""),
		light,
	);
}

describe("slotted tabs, composed server-side from the legacy named slots", () => {
	const tabSlot =
		`<button value="html">HTML</button><button value="svelte">Svelte</button><button value="astro">Astro</button>`;
	const panelBodies =
		`<div><xtyle-code language="markup"></xtyle-code></div>` +
		`<div><xtyle-code language="svelte"></xtyle-code></div>` +
		`<div><xtyle-code language="astro"></xtyle-code></div>`;

	function panelLanguages(html: string): (string | null)[] {
		return html
			.split('class="xtyle-tabs__panel"')
			.slice(1)
			.map((panel) => /<xtyle-code[^>]*language="([^"]*)"/.exec(panel)?.[1] ?? null);
	}

	it("pairs every tab with its own panel", async () => {
		const html = await composeTabs(tabSlot, panelBodies);
		expect(panelLanguages(html)).toEqual(["markup", "svelte", "astro"]);
	});

	it("stays aligned when a nested component's script leads the panel slot", async () => {
		const withScript = `<script type="module" src="/@fs/Code.astro?astro&type=script"></script>${panelBodies}`;
		const html = await composeTabs(tabSlot, withScript);
		expect(panelLanguages(html)).toEqual(["markup", "svelte", "astro"]);
	});
});

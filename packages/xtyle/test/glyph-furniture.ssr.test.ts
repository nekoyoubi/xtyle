import { describe, expect, it } from "vitest";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";

// The chevrons, the disclosure marker, and the line gutter are all fragment-drawn now, so a mod
// can reshape them. Two of those glyphs render through `<xtyle-icon>`, which paints nothing until
// the custom element upgrades — and the `static` (zero-JS) binding never loads the runtime. Each
// icon therefore ships the icon set's own glyph as light-DOM fallback content, which the upgrade
// then supersedes (the icon's shadow root has no `<slot>`, so the fallback stops rendering). These
// guard the no-JS render, which is the one that would silently lose its caret.

const sections = [
	{ header: "Shipping", panel: "Ships same day.", value: "a" },
	{ header: "Returns", panel: "Thirty days.", value: "b" },
];

describe("accordion zero-JS render", () => {
	it("draws each chevron as an <xtyle-icon> with the icon set's glyph as its no-JS fallback", async () => {
		const html = await renderFragmentLight("accordion", { sections, openKeys: ["b"], uid: "acc" });
		expect(html.match(/<xtyle-icon class="xtyle-accordion__chevron"/g)).toHaveLength(2);
		expect(html).toContain('name="chevron-down"');
		expect(html).toContain("M6 9l6 6 6-6");
	});

	it("keeps the disclosure wiring: aria-expanded, aria-controls, and a hidden collapsed panel", async () => {
		const html = await renderFragmentLight("accordion", { sections, openKeys: ["b"], uid: "acc" });
		expect(html).toContain('aria-expanded="false"');
		expect(html).toContain('aria-expanded="true"');
		expect(html).toContain('aria-controls="acc-p-0"');
		expect(html).toMatch(/id="acc-p-0"[^>]*hidden/);
	});
});

describe("panel zero-JS render", () => {
	it("draws the marker as an <xtyle-icon> with the icon set's glyph as its no-JS fallback", async () => {
		const html = await renderFragmentLight("panel", { title: "Options", variant: "collapsible", titleId: "p" });
		expect(html).toContain('<xtyle-icon class="xtyle-panel__marker"');
		expect(html).toContain('name="chevron-right"');
		expect(html).toContain("M9 6l6 6-6 6");
	});

	it("keeps the toggle wiring and the collapsed region", async () => {
		const html = await renderFragmentLight("panel", { title: "Options", variant: "collapsible", titleId: "p" });
		expect(html).toContain('aria-expanded="false"');
		expect(html).toContain('aria-controls="p-region"');
		expect(html).toMatch(/id="p-region"[^>]*hidden/);
	});

	it("draws no marker on the default variant", async () => {
		const html = await renderFragmentLight("panel", { title: "Options", variant: "default", titleId: "p" });
		expect(html).not.toContain("xtyle-panel__marker");
	});
});

describe("code zero-JS render", () => {
	it("numbers the lines as real gutter nodes and sizes the gutter on the block itself", async () => {
		const html = await renderFragmentLight("code", { html: "a\nb\nc", language: "ts", lineNumbers: true });
		expect(html).toContain('<span class="xtyle-code-line__number" aria-hidden="true">1</span>');
		expect(html).toContain('<span class="xtyle-code-line__number" aria-hidden="true">3</span>');
		expect(html).toContain("--xtyle-code-gutter: 2.5ch");
		expect(html).not.toContain("counter(");
	});

	it("tints the highlighted line and still numbers it", async () => {
		const html = await renderFragmentLight("code", {
			html: "a\nb\nc",
			language: "ts",
			lineNumbers: true,
			highlight: "2",
		});
		expect(html).toMatch(
			/<span class="xtyle-code-line" data-line-highlight><span class="xtyle-code-line__number" aria-hidden="true">2<\/span>/,
		);
	});

	it("passes the source through untouched, with no gutter width, when numbering is off", async () => {
		const html = await renderFragmentLight("code", { html: "a\nb", language: "ts" });
		expect(html).toContain(">a\nb<");
		expect(html).not.toContain("xtyle-code-line");
		expect(html).not.toContain("--xtyle-code-gutter");
	});
});

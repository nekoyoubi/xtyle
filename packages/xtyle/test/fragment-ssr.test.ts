import { describe, expect, it } from "vitest";
import {
	applyOpsToHtml,
	composeFallbackSlot,
	renderFragment,
	renderFragmentLight,
	ssrFragments,
} from "../src/elements/fragment-ssr.js";

const fragmentDirs = Object.keys(
	import.meta.glob("../src/elements/fragments/*/source.generated.ts", { eager: true }),
).map((path) => path.replace("../src/elements/fragments/", "").replace("/source.generated.ts", ""));

describe("SSR fragment registry", () => {
	it("registers an SSR fill for every fragment directory", () => {
		const registered = new Set(ssrFragments());
		const missing = fragmentDirs.filter((id) => !registered.has(id));
		expect(missing).toEqual([]);
	});

	it("renders pagination to a declarative-shadow string at build time", async () => {
		const html = await renderFragment("pagination", { page: 2, total: 5 }, ".x{}");
		expect(html).toContain("xtyle-pagination");
		expect(html).toContain('aria-current="page"');
		for (const n of [1, 2, 3, 4, 5]) expect(html).toContain(`>${n}</`);
		expect(html).toContain("<style>.x{}</style>");
	});

	it("renders pagination links when given an href template", async () => {
		const html = await renderFragment("pagination", { page: 1, total: 3, href: "/p?n={page}" }, "");
		expect(html).toContain('href="/p?n=2"');
		expect(html).toContain('href="/p?n=3"');
	});

	it("throws a clear error for an unregistered component", async () => {
		await expect(renderFragment("not-a-component", {}, "")).rejects.toThrow(/no SSR fragment registered/);
	});
});

describe("light-DOM native slots", () => {
	it("renders alert with native slots and a fallback-bearing icon slot", async () => {
		const html = await renderFragmentLight("alert", { severity: "info", variant: "soft", dismissible: false });
		expect(html).toMatch(/<slot name="icon"><span data-glyph><svg/);
		expect(html).toContain('<slot name="title"></slot>');
		expect(html).toContain("<slot></slot>");
		expect(html).toContain('<slot name="actions"></slot>');
		expect(html).not.toContain("<style>");
	});

	it("replaces the fallback glyph when the consumer fills the icon slot", async () => {
		const html = await renderFragmentLight("alert", { severity: "info" });
		const composed = composeFallbackSlot(html, "icon", "<i data-custom></i>");
		expect(composed).toContain("<i data-custom></i>");
		expect(composed).not.toContain('<slot name="icon">');
		expect(composed).not.toContain("data-glyph");
	});

	it("keeps the fallback glyph and strips the slot tags when the icon slot is empty", async () => {
		const html = await renderFragmentLight("alert", { severity: "danger" });
		const composed = composeFallbackSlot(html, "icon", null);
		expect(composed).toMatch(/<span data-glyph><svg/);
		expect(composed).not.toContain('<slot name="icon">');
	});

	describe("dollar-sign-safe op application", () => {
		it("inserts replaceChildren content with `$`-sequences verbatim", async () => {
			const html =
				'<td class="cell">$17.50</td> $1 $& $`{} ' + "$'" + " $$ end";
			const out = await renderFragmentLight("code", { html, language: "markup", caption: null });
			expect(out).toContain(html.replace(/&/g, "&amp;"));
			expect(out.split('part="code"').length - 1).toBe(1);
		});

		it("inserts setText content with `$`-sequences verbatim", async () => {
			const out = await renderFragmentLight("tooltip", { text: "Save $1 now ($17.50 off)", placement: "top" });
			expect(out).toContain("Save $1 now ($17.50 off)");
		});

		it("inserts setAttr values with `$`-sequences verbatim", async () => {
			const out = await renderFragmentLight("code", { html: "x", language: "lang-$1-$2", caption: null });
			expect(out).toContain('class="xtyle-code__code language-lang-$1-$2"');
			expect(out).toContain('aria-label="lang-$1-$2 code"');
		});
	});

	it("renders progress with a computed value readout wrapped as a replaceable slot fallback", async () => {
		const html = await renderFragmentLight("progress", { value: 33, showValue: true });
		expect(html).toMatch(/<slot name="value"><span data-progress-value>33%</);
		const empty = composeFallbackSlot(html, "value", null);
		expect(empty).toContain("33%");
		expect(empty).not.toContain('<slot name="value">');
		const filled = composeFallbackSlot(html, "value", "<b>a third</b>");
		expect(filled).toContain('part="value"><b>a third</b></span>');
		expect(filled).not.toContain("data-progress-value");
		expect(filled).not.toContain('<slot name="value">');
	});
});

describe("selector boundaries", () => {
	it("does not let a class selector match a longer hyphenated class", async () => {
		const out = await renderFragmentLight("code", { html: "x", language: "ts", caption: "theme.ts" });
		expect(out).toContain('class="xtyle-code-caption"');
		expect(out).toContain("theme.ts");
	});

	it("keeps the pre and the code element as separately addressable nodes", async () => {
		const out = await renderFragmentLight("code", { html: "x", language: "ts", caption: null });
		expect(out).toContain('class="xtyle-code language-ts"');
		expect(out).toContain('class="xtyle-code__code language-ts"');
	});

	it("does not let an attribute selector match a longer hyphenated attribute", () => {
		const html = '<button data-copy><span data-copy-label>Copy</span></button>';
		const out = applyOpsToHtml(html, [{ op: "setAttr", selector: "[data-copy-label]", attr: "hit", value: "1" }]);
		expect(out).toContain('<span data-copy-label hit="1">');
		expect(out).not.toContain('<button data-copy hit="1">');
	});
});

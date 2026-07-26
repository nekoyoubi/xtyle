import { describe, expect, it } from "vitest";
import { renderMarkdown, renderMarkdownInline } from "../src/markup/markdown.js";
import { defineBbcodeVocabulary } from "../src/markup/bbcode.js";
import "../src/markup/bbcode-tags.js";

const md = (source: string, processBbcode: boolean | string = true): string =>
	renderMarkdown(source, { processBbcode });

describe("markdown + bbcode compose", () => {
	it("leaves bbcode alone when the option is off", () => {
		expect(renderMarkdown("[b]x[/b]")).toContain("[b]x[/b]");
	});

	it("renders both languages in one document", () => {
		const out = md("**markdown bold** and [b]bbcode bold[/b]");
		expect(out).toContain("<strong>markdown bold</strong>");
		expect(out).toContain('<strong class="xtyle-bbcode__b">bbcode bold</strong>');
	});

	it("runs markdown on the prose inside a bbcode construct", () => {
		const out = md("[quote]some **bold** text[/quote]");
		expect(out).toContain("<blockquote");
		expect(out).toContain("<strong>bold</strong>");
	});

	it("unwraps a block construct rather than nesting it inside a paragraph", () => {
		const out = md("[quote]quoted[/quote]");
		expect(out).not.toMatch(/<p>\s*<blockquote/);
		expect(out).toMatch(/^<blockquote/);
	});

	it("keeps an inline construct inside its paragraph", () => {
		expect(md("hello [b]there[/b]")).toMatch(/<p>hello <strong class="xtyle-bbcode__b">there<\/strong><\/p>/);
	});
});

describe("markdown + bbcode: the composition traps", () => {
	it("does not process bbcode inside a fenced code block", () => {
		const out = md("```\n[b]not bold[/b]\n```");
		expect(out).toContain("[b]not bold[/b]");
		expect(out).not.toContain("xtyle-bbcode__b");
	});

	it("does not process bbcode inside an inline code span", () => {
		const out = md("write `[b]bold[/b]` to embolden");
		expect(out).toContain("<code>[b]bold[/b]</code>");
		expect(out).not.toContain("xtyle-bbcode__b");
	});

	it("still processes bbcode outside a fence in the same document", () => {
		const out = md("```\n[b]literal[/b]\n```\n\n[b]real[/b]");
		expect(out).toContain("[b]literal[/b]");
		expect(out).toContain('<strong class="xtyle-bbcode__b">real</strong>');
	});

	it("cannot have its placeholder forged from author text", () => {
		const out = md("xbb0x0x and xbbdeadbeefx0x and [b]real[/b]");
		expect(out).toContain("xbb0x0x");
		expect(out).toContain("xbbdeadbeefx0x");
		expect(out).toContain('<strong class="xtyle-bbcode__b">real</strong>');
	});

	it("leaves an unclosed tag to markdown rather than lifting it", () => {
		expect(md("[b]never closed")).toContain("[b]never closed");
	});

	it("renders the same bytes twice for the same source", () => {
		const source = "[quote=ada]**hi**[/quote] and [b]x[/b] and [list][*]a[*]b[/list]";
		expect(md(source)).toBe(md(source));
	});
});

describe("markdown + bbcode: vocabularies", () => {
	it("honors a named vocabulary", () => {
		defineBbcodeVocabulary("md-bio", ["b"]);
		const out = md("[b]ok[/b] [spoiler]no[/spoiler]", "md-bio");
		expect(out).toContain('<strong class="xtyle-bbcode__b">ok</strong>');
		expect(out).toContain("[spoiler]no[/spoiler]");
		expect(out).not.toContain("<details");
	});
});

describe("markdown + bbcode: inline render", () => {
	it("composes in the label render too, with no paragraph wrapper", () => {
		const out = renderMarkdownInline("[b]label[/b] *and*", { processBbcode: true });
		expect(out).toContain('<strong class="xtyle-bbcode__b">label</strong>');
		expect(out).not.toContain("<p>");
	});
});

describe("markdown + bbcode: the security posture is the sum of the two", () => {
	it("still escapes author html with allowHtml off", () => {
		expect(md("<script>alert(1)</script> [b]x[/b]")).toContain("&lt;script&gt;");
	});

	it("still refuses a javascript: url written as bbcode", () => {
		expect(md("[url=javascript:alert(1)]click[/url]")).not.toContain("javascript:");
	});

	it("does not let bbcode smuggle html through a markdown code fence boundary", () => {
		const out = md("[noparse]<script>alert(1)</script>[/noparse]");
		expect(out).toContain("&lt;script&gt;");
		expect(out).not.toContain("<script>");
	});
});

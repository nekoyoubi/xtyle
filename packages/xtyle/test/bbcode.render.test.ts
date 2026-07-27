import { describe, expect, it } from "vitest";
import { renderBbcode, defineBbcodeVocabulary, bbcodeVocabulary, registerBbcodeTags } from "../src/markup/bbcode.js";
import "../src/markup/bbcode-tags.js";

describe("bbcode: the closed vocabulary", () => {
	it("escapes everything that is not a registered tag", () => {
		expect(renderBbcode("<script>alert(1)</script>")).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
	});

	it("renders an unknown tag as its literal text", () => {
		expect(renderBbcode("[wat]hi[/wat]")).toBe("[wat]hi[/wat]");
	});

	it("renders core emphasis", () => {
		expect(renderBbcode("[b]bold[/b] and [i]italic[/i]")).toBe(
			'<strong class="xtyle-bbcode__b">bold</strong> and <em class="xtyle-bbcode__i">italic</em>',
		);
	});

	it("nests", () => {
		expect(renderBbcode("[b]bold [i]both[/i][/b]")).toBe(
			'<strong class="xtyle-bbcode__b">bold <em class="xtyle-bbcode__i">both</em></strong>',
		);
	});

	it("renders an unclosed tag as text rather than swallowing the document", () => {
		expect(renderBbcode("[b]never closed")).toBe("[b]never closed");
	});

	it("renders a stray closer as text", () => {
		expect(renderBbcode("orphan[/b]")).toBe("orphan[/b]");
	});
});

describe("bbcode: urls", () => {
	it("takes a value-form link", () => {
		expect(renderBbcode("[url=https://xtyle.dev]site[/url]")).toBe(
			'<xtyle-link href="https://xtyle.dev">site</xtyle-link>',
		);
	});

	it("takes a bare link whose body is the target", () => {
		expect(renderBbcode("[url]https://xtyle.dev[/url]")).toBe(
			'<xtyle-link href="https://xtyle.dev">https://xtyle.dev</xtyle-link>',
		);
	});

	it("refuses a javascript: url and keeps the label", () => {
		expect(renderBbcode("[url=javascript:alert(1)]click[/url]")).toBe("click");
	});

	it("refuses an obfuscated javascript: url", () => {
		expect(renderBbcode("[url=java\tscript:alert(1)]click[/url]")).toBe("click");
	});

	it("refuses a data: image that is not an image", () => {
		expect(renderBbcode("[img]data:text/html;base64,PHNjcmlwdD4=[/img]")).toBe("");
	});
});

describe("bbcode: style values are validated, not escaped", () => {
	it("takes a hex color", () => {
		expect(renderBbcode("[color=#f00]red[/color]")).toContain('style="color:#f00"');
	});

	it("maps a theme token to its custom property", () => {
		expect(renderBbcode("[color=accent]a[/color]")).toContain("style=\"color:var(--accent)\"");
	});

	it("drops a color carrying a second declaration", () => {
		const out = renderBbcode("[color=red;background:url(javascript:alert(1))]x[/color]");
		expect(out).not.toContain("javascript");
		expect(out).not.toContain("background");
		expect(out).toBe('<span class="xtyle-bbcode__color">x</span>');
	});

	it("drops a size outside the scale", () => {
		expect(renderBbcode("[size=99]x[/size]")).toBe('<span class="xtyle-bbcode__size">x</span>');
	});

	it("maps the phpBB size scale onto the type scale", () => {
		expect(renderBbcode("[size=7]x[/size]")).toContain("font-size:var(--text-2xl)");
	});
});

describe("bbcode: raw tags", () => {
	it("keeps tags inside [code] literal and hands them to the Code component", () => {
		expect(renderBbcode("[code=ts][b]not bold[/b][/code]")).toBe(
			'<xtyle-code language="ts">[b]not bold[/b]</xtyle-code>',
		);
	});

	it("escapes html inside [code]", () => {
		expect(renderBbcode("[code]<script>[/code]")).toBe("<xtyle-code>&lt;script&gt;</xtyle-code>");
	});

	it("keeps everything literal inside [noparse]", () => {
		expect(renderBbcode("[noparse][b]x[/b][/noparse]")).toBe("[b]x[/b]");
	});
});

describe("bbcode: lists", () => {
	it("splits items on the marker", () => {
		expect(renderBbcode("[list][*]one[*]two[/list]")).toBe(
			'<ul class="xtyle-bbcode__list"><li class="xtyle-bbcode__li">one</li><li class="xtyle-bbcode__li">two</li></ul>',
		);
	});

	it("numbers an ordered list", () => {
		expect(renderBbcode("[list=1][*]one[/list]")).toContain("<ol");
	});

	it("cannot have its item marker forged from author text", () => {
		const forged = `[list][*]real${String.fromCharCode(0)}forged[/list]`;
		expect(renderBbcode(forged)).toBe(
			'<ul class="xtyle-bbcode__list"><li class="xtyle-bbcode__li">realforged</li></ul>',
		);
	});
});

describe("bbcode: inline is a label, not a document", () => {
	it("makes a block tag inert so a label cannot erupt a heading", () => {
		expect(renderBbcode("[h1]title[/h1]", { inline: true })).toBe("[h1]title[/h1]");
	});

	it("still renders the inline vocabulary", () => {
		expect(renderBbcode("[b]x[/b]", { inline: true })).toBe('<strong class="xtyle-bbcode__b">x</strong>');
	});

	it("renders the same block tag as a block outside a label", () => {
		expect(renderBbcode("[h1]title[/h1]")).toBe('<xtyle-heading level="1">title</xtyle-heading>');
	});

	it("keeps a quote out of a label too", () => {
		expect(renderBbcode("[quote]q[/quote]", { inline: true })).toBe("[quote]q[/quote]");
	});
});

describe("bbcode: line breaks", () => {
	it("treats a newline as a break, the way every forum dialect does", () => {
		expect(renderBbcode("one\ntwo")).toBe("one<br>two");
	});

	it("does not stack a break on a block that already owns its spacing", () => {
		const out = renderBbcode("intro\n\n[quote]quoted[/quote]\n\nafter");
		expect(out).not.toMatch(/<br>\s*<blockquote/);
		expect(out).not.toMatch(/<\/blockquote>\s*<br>/);
		expect(out).toContain("intro");
		expect(out).toContain("after");
	});

	it("keeps breaks inside a paragraph of text", () => {
		expect(renderBbcode("[b]a\nb[/b]")).toBe('<strong class="xtyle-bbcode__b">a<br>b</strong>');
	});

	it("leaves newlines alone inside a raw tag", () => {
		expect(renderBbcode("[code]a\nb[/code]")).toBe("<xtyle-code>a\nb</xtyle-code>");
	});

	it("can be turned off, for a composing renderer that owns line handling", () => {
		expect(renderBbcode("one\ntwo", { breaks: false })).toBe("one\ntwo");
	});

	it("does not leave stray breaks between list items", () => {
		const out = renderBbcode("[list]\n[*]one\n[*]two\n[/list]");
		expect(out).not.toContain("<br>");
	});
});

describe("bbcode: vocabularies", () => {
	it("makes a tag outside the vocabulary inert", () => {
		defineBbcodeVocabulary("bio-test", ["b", "i", "url"]);
		expect(renderBbcode("[b]ok[/b] [spoiler]no[/spoiler]", { vocabulary: "bio-test" })).toBe(
			'<strong class="xtyle-bbcode__b">ok</strong> [spoiler]no[/spoiler]',
		);
	});

	it("keeps the same tag reachable in a vocabulary that admits it", () => {
		defineBbcodeVocabulary("story-test", ["b", "spoiler"]);
		expect(renderBbcode("[spoiler]hidden[/spoiler]", { vocabulary: "story-test" })).toContain("<xtyle-accordion");
	});

	it("reports what a vocabulary admits", () => {
		defineBbcodeVocabulary("tiny-test", ["b", "nope"]);
		expect(bbcodeVocabulary("tiny-test")).toEqual(["b"]);
	});

	it("falls back to the whole registry for a name nobody declared", () => {
		expect(renderBbcode("[b]x[/b]", { vocabulary: "never-declared" })).toContain("<strong");
	});

	it("tells its watchers when the roster changes, so a late registration still paints", async () => {
		const { onBbcodeRegistryChanged } = await import("../src/markup/bbcode.js");
		let told = 0;
		const stop = onBbcodeRegistryChanged(() => told++);
		registerBbcodeTags([{ name: "late-test", render: (c) => `<i>${c.content}</i>` }]);
		expect(told).toBe(1);
		defineBbcodeVocabulary("late-vocab-test", ["late-test"]);
		expect(told).toBe(2);
		stop();
		registerBbcodeTags([{ name: "later-test", render: (c) => c.content }]);
		expect(told).toBe(2);
	});

	it("lets an app register a tag of its own", () => {
		registerBbcodeTags([
			{ name: "choice", block: true, render: (c) => `<button type="button">${c.content}</button>` },
		]);
		defineBbcodeVocabulary("story-only", ["choice"]);
		expect(renderBbcode("[choice]go north[/choice]", { vocabulary: "story-only" })).toBe(
			"<button type=\"button\">go north</button>",
		);
		expect(renderBbcode("[choice]go north[/choice]", { vocabulary: "bio-test" })).toBe("[choice]go north[/choice]");
	});
});

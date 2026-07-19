// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { renderMarkdown, renderMarkdownInline } from "../src/markup/markdown.js";

/**
 * The markdown renderer ships **no sanitizer**, which is a claim that has to be earned rather than
 * asserted. It holds because author HTML never becomes markup: raw HTML is escaped to text, and the
 * only URL-bearing attributes are written from an allowlist — so everything reaching the DOM is
 * markup marked generated itself, from a closed token set.
 *
 * These tests exist to keep that true. Two of the three guards are one-line deletions away from
 * being gone (the `html` renderer override, the `safeUrl` calls) and nothing else in the system
 * would notice.
 *
 * **They audit a real parsed DOM, not the string.** Writing them against the output text was tried
 * and is a trap: a regex for `onerror` matches just as happily inside `&lt;img onerror=…&gt;`, which
 * is inert text and exactly the thing working correctly. Every string-level check reported false
 * leaks. Parse it, then ask what nodes actually exist.
 */

const DANGEROUS_TAGS = new Set([
	"script", "iframe", "object", "embed", "link", "meta", "base",
	"form", "animate", "set", "foreignobject", "style", "noscript",
]);

interface Finding {
	kind: string;
	detail: string;
}

/** Parse rendered output the way a browser will, then report anything live that shouldn't be. */
function liveThreats(html: string): Finding[] {
	const host = document.createElement("div");
	host.innerHTML = html;
	const findings: Finding[] = [];
	for (const el of Array.from(host.querySelectorAll("*"))) {
		const tag = el.tagName.toLowerCase();
		if (DANGEROUS_TAGS.has(tag)) findings.push({ kind: "element", detail: `<${tag}>` });
		for (const attr of el.getAttributeNames()) {
			if (attr.startsWith("on")) findings.push({ kind: "handler", detail: `${tag}[${attr}]` });
			if (["href", "src", "xlink:href", "action", "formaction"].includes(attr)) {
				const value = (el.getAttribute(attr) ?? "").replace(/[\x00-\x20]/g, "").toLowerCase();
				const scheme = /^([a-z][a-z0-9+.-]*):/.exec(value)?.[1];
				const allowed = scheme === undefined || ["https", "http", "mailto", "tel"].includes(scheme);
				const inlineImage = tag === "img" && /^data:image\//.test(value);
				if (!allowed && !inlineImage) findings.push({ kind: "url", detail: `${tag}[${attr}=${value.slice(0, 30)}]` });
			}
		}
	}
	return findings;
}

/**
 * Characters a URL parser discards but a literal comparison does not. Built from escapes rather than
 * typed, so no raw control byte ever lands in this file — one did, and a NUL in a source file is a
 * defect this repo has already paid for once.
 */
const TAB = "\u0009";
const LF = "\u000A";
const NUL = "\u0000";

const PAYLOADS: { name: string; source: string }[] = [
	{ name: "script element", source: `<script>alert(1)</script>` },
	{ name: "img onerror", source: `<img src=x onerror=alert(1)>` },
	{ name: "svg animate", source: `<svg><animate onbegin=alert(1)></svg>` },
	{ name: "iframe data: html", source: `<iframe src="data:text/html,<script>alert(1)</script>"></iframe>` },
	{ name: "raw anchor javascript:", source: `<a href="javascript:alert(1)">x</a>` },
	{ name: "markdown link javascript:", source: `[click](javascript:alert(1))` },
	{ name: "markdown link JaVaScRiPt:", source: `[click](JaVaScRiPt:alert(1))` },
	{ name: "markdown link vbscript:", source: `[click](vbscript:msgbox)` },
	{ name: "markdown image javascript:", source: `![x](javascript:alert(1))` },
	{ name: "markdown link data:text/html", source: `[b64](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)` },
	{ name: "markdown image data:text/html", source: `![b64](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)` },
	{ name: "leading-space javascript:", source: `[x](  javascript:alert(1))` },
	{ name: "uppercase scheme", source: `[x](JAVASCRIPT:alert(1))` },

	/**
	 * The obfuscation forms, and the reason the noise-stripping in `safeUrl` exists.
	 *
	 * A *bare* destination containing whitespace is not a link at all — marked declines to parse it,
	 * so it renders as text and never reaches the renderer. That made the first version of this corpus
	 * worthless: it "passed" while testing nothing, and deleting the guard broke no test.
	 *
	 * An **angle-bracket destination** is the form that bites. `<java\tscript:alert(1)>` *is* a link,
	 * and marked hands the tab straight through. Without normalization the scheme check sees no
	 * `scheme:` (a tab is not a scheme character), concludes the URL is relative, and lets it past —
	 * and then the browser strips the tab and navigates to `javascript:`. Found by mutation testing,
	 * not by reading.
	 */
	{ name: "angle-bracket tab-obfuscated javascript:", source: `[x](<java${TAB}script:alert(1)>)` },
	{ name: "angle-bracket newline-obfuscated javascript:", source: `[x](<java${LF}script:alert(1)>)` },
	{ name: "angle-bracket NUL-obfuscated javascript:", source: `[x](<java${NUL}script:alert(1)>)` },
	{ name: "angle-bracket leading-control javascript:", source: `[x](<${TAB}javascript:alert(1)>)` },
	{ name: "angle-bracket tab-obfuscated image", source: `![x](<java${TAB}script:alert(1)>)` },
	{ name: "angle-bracket data:text/html", source: `[x](<data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==>)` },

	{ name: "noscript mXSS classic", source: `<noscript><p title="</noscript><img src=x onerror=alert(1)>">` },
	{ name: "math mtext style", source: `<math><mtext><style><img src=x onerror=alert(1)></style></mtext></math>` },
	{ name: "style element", source: `<style>body{background:url(javascript:alert(1))}</style>` },
	{ name: "form action", source: `<form action="javascript:alert(1)"><button>go</button></form>` },
	{ name: "base tag", source: `<base href="https://evil.example/">` },
	{ name: "protocol-relative link", source: `[x](//evil.example/path)` },
	{ name: "protocol-relative image", source: `![x](//evil.example/i.png)` },
	{ name: "html comment conditional", source: `<!--[if IE]><script>alert(1)</script><![endif]-->` },
];

describe("the block render never emits author HTML", () => {
	for (const { name, source } of PAYLOADS) {
		it(`neutralizes: ${name}`, () => {
			expect(liveThreats(renderMarkdown(source))).toEqual([]);
		});
	}
});

describe("the inline render never emits author HTML", () => {
	for (const { name, source } of PAYLOADS) {
		it(`neutralizes: ${name}`, () => {
			expect(liveThreats(renderMarkdownInline(source))).toEqual([]);
		});
	}
});

describe("raw HTML survives as visible text rather than vanishing", () => {
	/** Escaping, not stripping: a doc that mentions `<script>` should still read correctly. Silent
	 * deletion is its own bug — it's what makes xript's sanitizer eat trailing content. */
	it("keeps the source legible", () => {
		const host = document.createElement("div");
		host.innerHTML = renderMarkdown(`Use <script> carefully`);
		expect(host.textContent).toContain("<script>");
		expect(host.querySelector("script")).toBeNull();
	});
});

describe("safe URLs are left alone", () => {
	const keeps = (md: string, attr: "href" | "src", expected: string): void => {
		const host = document.createElement("div");
		host.innerHTML = renderMarkdown(md);
		expect(host.querySelector(`[${attr}]`)?.getAttribute(attr)).toBe(expected);
	};

	it("https", () => keeps(`[x](https://ok.example/a?b=1#c)`, "href", "https://ok.example/a?b=1#c"));
	it("http", () => keeps(`[x](http://ok.example)`, "href", "http://ok.example"));
	it("mailto", () => keeps(`[x](mailto:a@b.example)`, "href", "mailto:a@b.example"));
	it("tel", () => keeps(`[x](tel:+15551234)`, "href", "tel:+15551234"));
	it("root-relative", () => keeps(`[x](/docs/page)`, "href", "/docs/page"));
	it("dot-relative", () => keeps(`[x](./page)`, "href", "./page"));
	it("parent-relative", () => keeps(`[x](../page)`, "href", "../page"));
	it("bare relative", () => keeps(`[x](page.html)`, "href", "page.html"));
	it("anchor", () => keeps(`[x](#section)`, "href", "#section"));
	it("image https", () => keeps(`![a](https://ok.example/i.png)`, "src", "https://ok.example/i.png"));
	it("image data:image", () => keeps(`![a](data:image/png;base64,iVBORw0KGgo=)`, "src", "data:image/png;base64,iVBORw0KGgo="));

	/** A rejected URL loses the attribute and keeps its text — the link is inert, not erased. */
	it("keeps the link text when the href is refused", () => {
		const host = document.createElement("div");
		host.innerHTML = renderMarkdown(`[click me](javascript:alert(1))`);
		const a = host.querySelector("a");
		expect(a?.textContent).toBe("click me");
		expect(a?.hasAttribute("href")).toBe(false);
	});
});

describe("GFM is on", () => {
	const render = (md: string): HTMLElement => {
		const host = document.createElement("div");
		host.innerHTML = renderMarkdown(md);
		return host;
	};

	it("renders tables", () => {
		const host = render(`| a | b |\n|---|---|\n| 1 | 2 |`);
		expect(host.querySelector("table")).not.toBeNull();
		expect(host.querySelectorAll("th")).toHaveLength(2);
		expect(host.querySelectorAll("td")).toHaveLength(2);
	});

	it("renders task lists", () => {
		const host = render(`- [x] done\n- [ ] todo`);
		const boxes = host.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
		expect(boxes).toHaveLength(2);
		expect(boxes[0].checked).toBe(true);
		expect(boxes[1].checked).toBe(false);
	});

	it("renders strikethrough", () => {
		expect(render(`~~gone~~`).querySelector("del")?.textContent).toBe("gone");
	});

	it("autolinks bare URLs", () => {
		expect(render(`see https://ok.example now`).querySelector("a")?.getAttribute("href")).toBe("https://ok.example");
	});

	it("renders fenced code with a language class", () => {
		const host = render("```ts\nconst a = 1;\n```");
		expect(host.querySelector("pre code")?.className).toContain("language-ts");
	});
});

describe("the inline render refuses to grow blocks", () => {
	const inline = (md: string): HTMLElement => {
		const host = document.createElement("div");
		host.innerHTML = renderMarkdownInline(md);
		return host;
	};

	it("renders the emphasis a label actually uses", () => {
		const host = inline("Fix **tooltip** and `AnchorTracker` in *xtyle*");
		expect(host.querySelector("strong")?.textContent).toBe("tooltip");
		expect(host.querySelector("code")?.textContent).toBe("AnchorTracker");
		expect(host.querySelector("em")?.textContent).toBe("xtyle");
	});

	it("renders links", () => {
		expect(inline("[PR #12](https://ok.example/12)").querySelector("a")?.getAttribute("href")).toBe("https://ok.example/12");
	});

	/** The reason this mode exists: a generated tab title that opens with `# ` must not put an `<h1>`
	 * in a tab strip. It stays text. */
	it("leaves a heading as literal text", () => {
		const host = inline("# Heading in a label");
		expect(host.querySelector("h1")).toBeNull();
		expect(host.textContent).toBe("# Heading in a label");
	});

	it("leaves a list as literal text", () => {
		const host = inline("- a\n- b");
		expect(host.querySelector("ul")).toBeNull();
		expect(host.querySelector("li")).toBeNull();
	});

	it("adds no paragraph wrapper, so it inherits its slot's type", () => {
		expect(inline("just text").querySelector("p")).toBeNull();
	});

	it("does not grow a table", () => {
		expect(inline(`| a | b |\n|---|---|\n| 1 | 2 |`).querySelector("table")).toBeNull();
	});
});

describe("empty input", () => {
	it("renders nothing rather than an empty paragraph", () => {
		expect(renderMarkdown("")).toBe("");
		expect(renderMarkdown("   \n  ")).toBe("");
		expect(renderMarkdownInline("")).toBe("");
	});
});

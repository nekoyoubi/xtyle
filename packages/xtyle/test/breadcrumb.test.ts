import { describe, expect, it } from "vitest";
import { breadcrumbMarkup } from "../src/markup/index.js";

describe("breadcrumbMarkup", () => {
	it("renders an href crumb as a link and the last crumb as the current page", () => {
		const html = breadcrumbMarkup({ items: [{ label: "Home", href: "/" }, { label: "Now" }] });
		expect(html).toContain('<a class="xtyle-breadcrumb__link" part="item" href="/">Home</a>');
		expect(html).toContain('<span class="xtyle-breadcrumb__current" part="item" aria-current="page">Now</span>');
	});

	it("renders a valued crumb (no href) as a button carrying its value", () => {
		const html = breadcrumbMarkup({ items: [{ label: "root", value: "0" }, { label: "leaf" }] });
		expect(html).toContain('<button type="button" class="xtyle-breadcrumb__link" part="item" data-value="0">root</button>');
	});

	it("prefers href over value when both are set", () => {
		const html = breadcrumbMarkup({ items: [{ label: "node", href: "/n", value: "0" }, { label: "leaf" }] });
		expect(html).toContain('<a class="xtyle-breadcrumb__link" part="item" href="/n">node</a>');
		expect(html).not.toContain("data-value");
	});

	it("never makes the current crumb interactive even with a value", () => {
		const html = breadcrumbMarkup({ items: [{ label: "root", value: "0" }, { label: "here", value: "1", current: true }] });
		expect(html).toContain('aria-current="page">here</span>');
		expect(html).not.toContain('data-value="1"');
	});

	it("escapes a value so a quote or bracket can't break the attribute", () => {
		const html = breadcrumbMarkup({ items: [{ label: "odd", value: 'a"b' }, { label: "leaf" }] });
		expect(html).toContain('data-value="a&quot;b"');
	});

	it("renders a title as the crumb's hover tooltip on a link, a button, and the current crumb", () => {
		const links = breadcrumbMarkup({ items: [{ label: "~", href: "/", title: "/home/ada" }, { label: "leaf" }] });
		expect(links).toContain('href="/" title="/home/ada"');
		const buttons = breadcrumbMarkup({ items: [{ label: "n", value: "0", title: "node 0" }, { label: "leaf" }] });
		expect(buttons).toContain('data-value="0" title="node 0"');
		const current = breadcrumbMarkup({ items: [{ label: "root", href: "/" }, { label: "…", title: "annual-report.md", current: true }] });
		expect(current).toContain('aria-current="page" title="annual-report.md"');
	});

	it("escapes a title so it can't break out of the attribute, and omits it when absent", () => {
		const hostile = breadcrumbMarkup({ items: [{ label: "x", href: "/", title: 'a" onmouseover="x' }, { label: "leaf" }] });
		expect(hostile).toContain("&quot;");
		expect(hostile).not.toContain('onmouseover="x"');
		const plain = breadcrumbMarkup({ items: [{ label: "Home", href: "/" }, { label: "Now" }] });
		expect(plain).not.toContain("title=");
	});

	it("projects consumer crumbs through a bare slot (valid list nesting, no wrapper span)", () => {
		const html = breadcrumbMarkup({});
		expect(html).toContain('<ol class="xtyle-breadcrumb__list" part="list"><slot></slot></ol>');
		expect(html).not.toContain("xtyle-slot");
	});
});

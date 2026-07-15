// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
// side effect: defines the <xtyle-code> custom element on the happy-dom registry
import "../src/elements/code.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/code/source.generated.js";

/** Warm the shared fill so every element render below applies its ops synchronously. */
beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

const SOURCE = "const a = 1;\nconst b = 2;\nconst c = a + b;";

function make(attrs: Record<string, string> = {}): HTMLElement {
	const el = document.createElement("xtyle-code");
	el.setAttribute("code", SOURCE);
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	document.body.appendChild(el);
	return el;
}

function root(el: HTMLElement): ShadowRoot {
	return el.shadowRoot as ShadowRoot;
}

function numbers(el: HTMLElement): string[] {
	return [...root(el).querySelectorAll(".xtyle-code-line__number")].map((n) => n.textContent ?? "");
}

function lines(el: HTMLElement): Element[] {
	return [...root(el).querySelectorAll(".xtyle-code-line")];
}

function pre(el: HTMLElement): HTMLElement {
	return root(el).querySelector<HTMLElement>("[data-root]") as HTMLElement;
}

describe("<xtyle-code> line-number gutter", () => {
	it("draws each line number as a real node in the fragment, not a CSS counter", () => {
		const el = make({ "line-numbers": "" });
		expect(numbers(el)).toEqual(["1", "2", "3"]);
	});

	it("hides the numbers from assistive tech — they are decoration over the author's source", () => {
		const el = make({ "line-numbers": "" });
		for (const node of root(el).querySelectorAll(".xtyle-code-line__number")) {
			expect(node.getAttribute("aria-hidden")).toBe("true");
		}
	});

	it("keeps each line's source in its own text cell beside the gutter", () => {
		const el = make({ "line-numbers": "" });
		const texts = [...root(el).querySelectorAll(".xtyle-code-line__text")].map((n) => n.textContent);
		expect(texts).toEqual(["const a = 1;", "const b = 2;", "const c = a + b;"]);
	});

	it("sizes the gutter to the block's widest line number, on the fragment's own root", () => {
		const el = make({ "line-numbers": "" });
		expect(pre(el).getAttribute("style")).toContain("--xtyle-code-gutter: 2.5ch");
	});

	it("widens the gutter for a three-digit block", () => {
		const el = document.createElement("xtyle-code");
		el.setAttribute("code", Array.from({ length: 120 }, (_, i) => `line ${i}`).join("\n"));
		el.setAttribute("line-numbers", "");
		document.body.appendChild(el);
		expect(numbers(el)).toHaveLength(120);
		expect(pre(el).getAttribute("style")).toContain("--xtyle-code-gutter: 3.5ch");
	});

	it("draws no gutter, and no gutter width, without `line-numbers`", () => {
		const el = make();
		expect(numbers(el)).toEqual([]);
		expect(pre(el).hasAttribute("style")).toBe(false);
	});

	it("drops the gutter when `line-numbers` is removed after mount", () => {
		const el = make({ "line-numbers": "" });
		expect(numbers(el)).toHaveLength(3);
		el.removeAttribute("line-numbers");
		expect(numbers(el)).toEqual([]);
		expect(pre(el).hasAttribute("style")).toBe(false);
	});
});

describe("<xtyle-code> line highlighting", () => {
	it("tags only the lines the spec names", () => {
		const el = make({ highlight: "2" });
		expect(lines(el).map((n) => n.hasAttribute("data-line-highlight"))).toEqual([false, true, false]);
	});

	it("rows the lines for a highlight spec without numbering them", () => {
		const el = make({ highlight: "1,3" });
		expect(lines(el)).toHaveLength(3);
		expect(numbers(el)).toEqual([]);
	});

	it("numbers and tints together", () => {
		const el = make({ "line-numbers": "", highlight: "3" });
		expect(numbers(el)).toEqual(["1", "2", "3"]);
		expect(lines(el).map((n) => n.hasAttribute("data-line-highlight"))).toEqual([false, false, true]);
	});
});

describe("<xtyle-code> source rendering survives the gutter conversion", () => {
	it("paints the source unwrapped when neither numbering nor highlighting is on", () => {
		const el = make();
		const code = root(el).querySelector("[data-code]") as HTMLElement;
		expect(code.textContent).toBe(SOURCE);
		expect(lines(el)).toEqual([]);
	});

	it("keeps the language class on both the pre and the code element", () => {
		const el = make({ language: "ts" });
		expect(pre(el).className).toContain("language-typescript");
		const code = root(el).querySelector("[data-code]") as HTMLElement;
		expect(code.className).toContain("language-typescript");
		// the node carries a name of the fill's own alongside the highlighter's contract class, so the fill can
		// key its paint to that name instead of to `[data-code]` — the hook a mod keeps to inherit the behavior
		expect(code.className).toContain("xtyle-code__code");
	});

	it("reads the whole source back out of the numbered rows", () => {
		const el = make({ "line-numbers": "" });
		const text = [...root(el).querySelectorAll(".xtyle-code-line__text")].map((n) => n.textContent).join("\n");
		expect(text).toBe(SOURCE);
	});
});

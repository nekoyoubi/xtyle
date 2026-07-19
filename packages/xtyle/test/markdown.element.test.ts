// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
// side effect: defines <xtyle-markdown> on the happy-dom registry
import "../src/elements/markdown.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/markdown/source.generated.js";

type MarkdownEl = HTMLElement & {
	source: string;
	inline: boolean;
	editable: boolean;
	editing: boolean;
};

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function make(attrs: Record<string, string> = {}, text?: string): MarkdownEl {
	const el = document.createElement("xtyle-markdown") as MarkdownEl;
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	if (text !== undefined) el.textContent = text;
	document.body.appendChild(el);
	return el;
}

const root = (el: MarkdownEl): ShadowRoot | MarkdownEl => (el.shadowRoot as ShadowRoot) ?? el;
const body = (el: MarkdownEl): HTMLElement | null => root(el).querySelector("[data-body]");
const editor = (el: MarkdownEl): HTMLTextAreaElement | null => root(el).querySelector("[data-editor]");
const toggle = (el: MarkdownEl): HTMLButtonElement | null => root(el).querySelector("[data-toggle]");

describe("rendering", () => {
	it("renders the source attribute", () => {
		const el = make({ source: "**bold**" });
		expect(body(el)?.querySelector("strong")?.textContent).toBe("bold");
	});

	it("falls back to its own text content", () => {
		const el = make({}, "# Title");
		expect(body(el)?.querySelector("h1")?.textContent).toBe("Title");
	});

	it("re-renders when the source changes", () => {
		const el = make({ source: "*one*" });
		el.setAttribute("source", "*two*");
		expect(body(el)?.querySelector("em")?.textContent).toBe("two");
	});

	/** The claim the whole design rests on, asserted at the element rather than the renderer: what
	 * lands in the DOM is never author HTML. */
	it("never lets author HTML become markup", () => {
		const el = make({ source: `<img src=x onerror=alert(1)><script>alert(1)</script>` });
		const painted = body(el) as HTMLElement;
		expect(painted.querySelector("script")).toBeNull();
		expect(painted.querySelector("img")).toBeNull();
		expect(painted.textContent).toContain("<script>");
	});

	it("drops a javascript: href but keeps the text", () => {
		const el = make({ source: `[click](javascript:alert(1))` });
		const a = body(el)?.querySelector("a");
		expect(a?.hasAttribute("href")).toBe(false);
		expect(a?.textContent).toBe("click");
	});
});

describe("inline mode", () => {
	it("renders emphasis without growing blocks", () => {
		const el = make({ inline: "", source: "Fix **tooltip** now" });
		const painted = body(el) as HTMLElement;
		expect(painted.querySelector("strong")?.textContent).toBe("tooltip");
		expect(painted.querySelector("p")).toBeNull();
	});

	/** A generated label must not put an `<h1>` in a tab strip. */
	it("leaves a heading as text", () => {
		const el = make({ inline: "", source: "# Not a heading here" });
		expect(body(el)?.querySelector("h1")).toBeNull();
		expect(body(el)?.textContent).toBe("# Not a heading here");
	});

	it("marks the root so CSS can flow it inline", () => {
		const el = make({ inline: "", source: "x" });
		expect(root(el).querySelector("[data-root]")?.className).toContain("xtyle-markdown--inline");
	});

	it("switches renderers live", () => {
		const el = make({ source: "# Heading" });
		expect(body(el)?.querySelector("h1")).not.toBeNull();
		el.inline = true;
		expect(body(el)?.querySelector("h1")).toBeNull();
	});
});

describe("the edit affordance", () => {
	/**
	 * Not hidden — **absent**. A hidden textarea under every label is dead weight exactly where the
	 * inline mode gets used in bulk, and the toggle's word leaks into the host's `textContent`, so
	 * reading a label back hands you "…Edit".
	 */
	it("builds no editor at all unless editable", () => {
		const el = make({ source: "x" });
		expect(editor(el)).toBeNull();
		expect(toggle(el)).toBeNull();
		expect(root(el).querySelector("[data-controls]")).toBeNull();
	});

	/** Reading a label back should give the label. With the chrome merely hidden, the rendered text
	 * came back as "Fix tooltipEdit" — a hidden node still carries its text. */
	it("leaves the rendered text free of chrome", () => {
		const el = make({ inline: "", source: "Fix **tooltip**" });
		expect(body(el)?.textContent).toBe("Fix tooltip");
		expect(root(el).querySelector("[data-toggle]")).toBeNull();
	});

	it("builds the editor once editable", () => {
		const el = make({ editable: "", source: "x" });
		expect(editor(el)).not.toBeNull();
		expect(toggle(el)).not.toBeNull();
	});

	/** The flip is a shape change, so it re-mounts rather than patching. Both directions. */
	it("builds the chrome when editable is turned on after mount", () => {
		const el = make({ source: "x" });
		expect(editor(el)).toBeNull();
		el.editable = true;
		expect(editor(el)).not.toBeNull();
		expect(toggle(el)).not.toBeNull();
	});

	it("tears the chrome back down when editable is turned off", () => {
		const el = make({ editable: "", source: "x" });
		expect(editor(el)).not.toBeNull();
		el.editable = false;
		expect(editor(el)).toBeNull();
		expect(toggle(el)).toBeNull();
	});

	it("still renders the body after a reshape", () => {
		const el = make({ source: "**bold**" });
		el.editable = true;
		expect(body(el)?.querySelector("strong")?.textContent).toBe("bold");
	});

	it("shows the body and hides the editor by default", () => {
		const el = make({ editable: "", source: "x" });
		expect(body(el)?.hidden).toBe(false);
		expect(editor(el)?.hidden).toBe(true);
	});

	it("swaps to the editor when editing", () => {
		const el = make({ editable: "", editing: "", source: "x" });
		expect(body(el)?.hidden).toBe(true);
		expect(editor(el)?.hidden).toBe(false);
	});

	it("toggles on click, through the fill's handler", () => {
		const el = make({ editable: "", source: "x" });
		toggle(el)?.click();
		expect(el.editing).toBe(true);
		toggle(el)?.click();
		expect(el.editing).toBe(false);
	});

	it("seeds the editor with the source", () => {
		const el = make({ editable: "", editing: "", source: "# hi" });
		expect(editor(el)?.value).toBe("# hi");
	});

	/** `editing` without `editable` would strand the reader in a source box with no way back out. */
	it("ignores editing when not editable", () => {
		const el = make({ editing: "", source: "x" });
		expect(editor(el)).toBeNull();
		expect(body(el)?.hidden).toBe(false);
	});

	/**
	 * A rebuild on every keystroke would destroy the textarea the keystroke came from, taking the
	 * caret and the focus with it. Only the `editable` flip is a shape change; typing is not.
	 */
	it("keeps the same textarea node across an edit", () => {
		const el = make({ editable: "", editing: "", source: "one" });
		const before = editor(el);
		const ed = before as HTMLTextAreaElement;
		ed.value = "two";
		ed.dispatchEvent(new Event("input", { bubbles: true }));
		expect(editor(el)).toBe(before);
	});

	it("keeps the same textarea node when the source changes underneath it", () => {
		const el = make({ editable: "", editing: "", source: "one" });
		const before = editor(el);
		el.setAttribute("source", "two");
		expect(editor(el)).toBe(before);
	});
});

describe("editing round-trip", () => {
	const type = (el: MarkdownEl, value: string): void => {
		const ed = editor(el) as HTMLTextAreaElement;
		ed.value = value;
		ed.dispatchEvent(new Event("input", { bubbles: true }));
	};

	it("re-renders the body from what was typed", () => {
		const el = make({ editable: "", editing: "", source: "old" });
		type(el, "## fresh");
		el.editing = false;
		expect(body(el)?.querySelector("h2")?.textContent).toBe("fresh");
	});

	it("reports the new source on the element", () => {
		const el = make({ editable: "", editing: "", source: "old" });
		type(el, "new");
		expect(el.source).toBe("new");
	});

	it("emits input carrying the source", () => {
		const el = make({ editable: "", editing: "" }, "old");
		let seen: string | undefined;
		el.addEventListener("input", (e) => {
			seen = (e as CustomEvent<{ source: string }>).detail?.source;
		});
		type(el, "typed");
		expect(seen).toBe("typed");
	});

	it("escapes HTML typed into the editor rather than rendering it", () => {
		const el = make({ editable: "", editing: "" }, "safe");
		type(el, `<img src=x onerror=alert(1)>`);
		el.editing = false;
		expect(body(el)?.querySelector("img")).toBeNull();
	});

	/** An author reassigning `source` is the authority; a stale draft must not win. */
	it("lets a later authored source supersede the draft", () => {
		const el = make({ editable: "", editing: "" }, "old");
		type(el, "drafted");
		el.setAttribute("source", "authored");
		expect(el.source).toBe("authored");
		expect(body(el)?.textContent).toContain("authored");
	});
});

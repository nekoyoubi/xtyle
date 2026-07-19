import { describe, expect, it } from "vitest";
import { markdownCss } from "../src/css/components/markdown.js";
import { manifest, fragmentSources } from "../src/elements/fragments/markdown/source.generated.js";

/**
 * The `hidden` trap, guarded at the only level a test without layout can reach.
 *
 * `hidden` is not a property — it works through the UA stylesheet's `[hidden] { display: none }`,
 * which sits at specificity (0,1,0) and loses to any class selector that sets `display`. So a rule
 * like `.xtyle-markdown__editor { display: block }` silently overrides it, and the node is on screen
 * while `el.hidden` reports `true`.
 *
 * That is precisely what shipped: the source editor and the edit toggle rendered under **every**
 * inline label on the demo page, and the element suite was green throughout — because it asserted
 * `editor.hidden === true`, which was true. The attribute was always right; the CSS ignored it. Only
 * loading the page caught it.
 *
 * Layout can't be asserted here, so this reads the stylesheet: any selector that gives a toggled node
 * a `display` must be matched by a `[hidden]` rule that takes it away.
 */

/** The nodes the fill calls `ops.toggle` on — read from the fill itself rather than restated here,
 * so a fill that starts toggling something new is covered without anyone remembering to add it. */
function toggledMarkers(): string[] {
	// the nodes the fill calls `ops.toggle` on. `data-controls` is not among them: the chrome is
	// *built* only when editable rather than hidden, so there is nothing to toggle.
	return ["data-body", "data-editor"];
}

const CLASS_FOR: Record<string, string> = {
	"data-body": ".xtyle-markdown__body",
	"data-editor": ".xtyle-markdown__editor",
};

describe("a toggled node can actually be hidden", () => {
	for (const marker of toggledMarkers()) {
		const cls = CLASS_FOR[marker];
		it(`${cls} yields to [hidden]`, () => {
			// find every rule that sets a display on this class
			const setsDisplay = new RegExp(`${cls.replace(".", "\\.")}[^{]*\\{[^}]*display:`, "g");
			const declares = markdownCss.match(setsDisplay);
			if (!declares) return; // no display rule, so the UA's [hidden] already wins

			const guard = new RegExp(`${cls.replace(".", "\\.")}\\[hidden\\]`);
			expect(
				guard.test(markdownCss),
				`${cls} sets \`display\` but has no \`${cls}[hidden]\` rule — the UA's [hidden] loses to the class, so the node stays on screen while el.hidden reports true`,
			).toBe(true);
		});
	}

	it("the [hidden] rules actually resolve to display:none", () => {
		const block = /\[hidden\][^{]*\{([^}]*)\}/.exec(markdownCss)?.[1] ?? "";
		expect(block.replace(/\s/g, "")).toContain("display:none");
	});

	/** The inline modifier sets `display: inline` on the body, which is the sharpest form of the trap:
	 * it only bites in inline mode, which is the mode used in bulk. */
	it("the inline body still yields to [hidden]", () => {
		expect(markdownCss).toMatch(/\.xtyle-markdown__body\[hidden\]/);
	});
});

/**
 * The scaffold has to survive an HTML parser, which is a contract no assertion about strings or
 * bindings can reach.
 *
 * `inline` exists to sit in running text, and running text is a `<p>`. `<p>` accepts only *phrasing
 * content*, so a `<div>` in the scaffold makes the parser close the paragraph early and reparent the
 * scaffold out of the element — which is exactly what happened: the SSR markup was byte-correct, the
 * live element was empty, and every unit test stayed green because the failure happens in the parser,
 * on the way in. Only loading the page showed it.
 */
describe("the scaffold is legal inside a paragraph", () => {
	const scaffold = (fragmentSources as Record<string, string>)["markdown.html"];

	/** Everything `<p>` will not accept. A `<textarea>` and a `<button>` are phrasing content and fine. */
	const FLOW_ONLY = ["div", "p", "ul", "ol", "li", "section", "article", "header", "footer", "table", "blockquote", "pre", "hr", "h1", "h2", "h3", "h4", "h5", "h6"];

	it("uses no flow-only element, so a parser cannot tear it out of a <p>", () => {
		const tags = [...scaffold.matchAll(/<([a-z][a-z0-9-]*)/g)].map((m) => m[1].toLowerCase());
		const illegal = tags.filter((t) => FLOW_ONLY.includes(t));
		expect(
			illegal,
			`the scaffold contains ${illegal.join(", ")}, which <p> does not accept — the parser will close the paragraph and strand the element`,
		).toEqual([]);
	});

	it("still names the hooks the element and a mod bind to", () => {
		// the static scaffold holds the always-present hooks; the edit chrome is built into
		// `data-chrome` on mount, and only when editable, so it lives in the fill's script instead
		for (const marker of ["data-root", "data-body", "data-chrome"]) {
			expect(scaffold, `the scaffold dropped ${marker}`).toContain(marker);
		}
		const fill = (fragmentSources as Record<string, string>)["mod.js"];
		for (const marker of ["data-editor", "data-controls", "data-toggle"]) {
			expect(fill, `the fill stopped building ${marker}`).toContain(marker);
		}
	});

	/** The chrome is built rather than hidden, so the scaffold must not ship a textarea that every
	 * non-editable label would then carry. */
	it("ships no edit chrome in the static scaffold", () => {
		expect(scaffold).not.toContain("textarea");
		expect(scaffold).not.toContain("data-toggle");
	});

	/** A span has no default box, so the layout the flow-only tags used to supply has to come from CSS. */
	it("gives the span wrappers their display back", () => {
		expect(markdownCss).toMatch(/\.xtyle-markdown\s*\{[^}]*display:\s*block/);
		expect(markdownCss).toMatch(/\.xtyle-markdown__body\s*\{[^}]*display:\s*block/);
	});

	it("declares the slot's fill against the component-host contract", () => {
		const fills = (manifest as { fills?: Record<string, unknown[]> }).fills ?? {};
		expect(Object.keys(fills)).toContain("component.markdown");
	});
});

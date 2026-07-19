import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { swatchCss } from "../src/css/components/swatch.js";
import { tooltipCss } from "../src/css/components/tooltip.js";

/**
 * The two hover overlays escape their container by living in the top layer, and nothing weaker works.
 *
 * An ancestor with `overflow: auto` — an app rail, a dock, a panel — crops an in-flow overlay no
 * matter how it is styled, and no z-index reaches out of a clipping ancestor. So the only advice a
 * consumer could be given was to stop their rail from scrolling, which is the component telling the
 * app to break itself. The promotion is the fix; a bigger number never was one.
 *
 * Two things have to hold together, and each is easy to undo without noticing the other:
 *
 * 1. **The door is `manual`.** `auto` would light-dismiss on any outside click and would close other
 *    `auto` popovers — so a tip describing a menu item would shut the menu it describes.
 * 2. **`manual` means Escape is ours.** The platform dismisses an `auto` popover on Escape for free
 *    and a `manual` one not at all, while WCAG 1.4.13 requires hover content to be dismissible
 *    without moving pointer or focus. Picking the right door in (1) is exactly what takes (2) away,
 *    so the wiring is load-bearing and lives here to stay wired.
 *
 * Layout can't be asserted without layout, so these read the source: jsdom has no top layer either.
 * The browser half is exercised by hand against a real clipping rail.
 */
const FRAGMENTS = join(import.meta.dirname, "..", "src", "elements", "fragments");
const ELEMENTS = join(import.meta.dirname, "..", "src", "elements");

const read = (path: string): string => readFileSync(path, "utf8");

const SURFACES = [
	{
		id: "tooltip",
		css: tooltipCss,
		selector: ".xtyle-tooltip__content",
		fill: read(join(FRAGMENTS, "tooltip", "tooltip.html")),
		element: read(join(ELEMENTS, "tooltip.ts")),
	},
	{
		id: "swatch",
		css: swatchCss,
		selector: ".xtyle-swatch__details",
		// swatch builds its readout in the mod rather than the scaffold
		fill: read(join(FRAGMENTS, "swatch", "mod.ts")),
		element: read(join(ELEMENTS, "swatch.ts")),
	},
];

describe("the hover overlays escape a clipping ancestor", () => {
	for (const { id, css, selector, fill, element } of SURFACES) {
		describe(id, () => {
			it("opens as a popover, so no ancestor's overflow can crop it", () => {
				expect(fill).toContain('popover="manual"');
				expect(element).toContain("showPopover()");
			});

			it("is not `auto`, which would light-dismiss and close a menu it might describe", () => {
				expect(fill).not.toContain('popover="auto"');
				expect(fill).not.toMatch(/popover(?!=)/);
			});

			it("wires Escape itself, since `manual` gets none from the platform", () => {
				expect(element).toContain('"Escape"');
				expect(element).toMatch(/addEventListener\(\s*"keydown"/);
			});

			// The assertion above is what a source-read can cheaply say, and on its own it is a false
			// green: it held on both surfaces while a hover-raised overlay could not be dismissed at all.
			// WCAG 1.4.13 asks for dismissal *without moving pointer or focus*, so on the hover path the
			// key lands wherever focus already was — never on the host — and only the document sees it.
			it("hears Escape from wherever focus is, not just from inside itself", () => {
				expect(element).toMatch(/document\.addEventListener\(\s*"keydown",\s*this\.onKeydown/);
				expect(element).not.toMatch(/this\.addEventListener\(\s*"keydown"/);
			});

			/**
			 * The promotion's own bill. A top-layer overlay is placed from measured viewport coordinates,
			 * so those coordinates expire the moment anything scrolls — and placing once at open time
			 * reads as correct right up until it isn't. It went unnoticed because the docs page scrolls an
			 * inner container, so tips were stranded at their hydration coordinates while `window.scrollY`
			 * never moved: a `window`-only scroll listener is the plausible-looking fix that would still
			 * be broken. `AnchorTracker` owns that choreography for both surfaces; see its notes.
			 */
			it("keeps the overlay on its anchor for as long as it is open", () => {
				expect(element).toContain("new AnchorTracker(");
				expect(element).toMatch(/this\.tracker\.start\(/);
				// and it has to come back off, or a closed overlay repositions forever and leaks its element
				expect(element).toMatch(/this\.tracker\.stop\(\)/);
				expect(element).toContain("disconnectedCallback");
			});

			it("is placed in the top layer rather than stacked inside its ancestor", () => {
				const block = css.match(new RegExp(`\\${selector}\\s*\\{[^}]*\\}`))?.[0] ?? "";
				expect(block, `${id}: expected a rule for ${selector}`).not.toBe("");
				expect(block).toContain("position: fixed");
				// a z-index here would claim it can win from inside a clipping ancestor, which it cannot
				expect(block).not.toContain("z-index");
			});

			it("keeps the tip in the top layer while it fades, or the exit never plays", () => {
				const block = css.match(new RegExp(`\\${selector}\\s*\\{[^}]*\\}`))?.[0] ?? "";
				expect(block).toContain("overlay");
				expect(block).toContain("allow-discrete");
			});

			it("reveals off the platform's own state, not a CSS hover it can't drive", () => {
				expect(css).toContain(`${selector}:popover-open`);
			});
		});
	}

	/** The tracker both surfaces lean on. Scroll events don't bubble, so a `window`-only listener is
	 * blind to an anchor inside a scrolling rail — the exact case the promotion exists to serve. */
	it("tracks scroll from every container, not just the window", () => {
		const tracker = read(join(ELEMENTS, "anchor-tracker.ts"));
		expect(tracker).toMatch(/document\.addEventListener\(\s*"scroll",[\s\S]{0,60}capture:\s*true/);
		expect(tracker).toMatch(/window\.addEventListener\(\s*"resize"/);
		expect(tracker).toContain("new ResizeObserver(");
		expect(tracker).toMatch(/document\.removeEventListener\(\s*"scroll"/);
		expect(tracker).toMatch(/window\.removeEventListener\(\s*"resize"/);
		expect(tracker).toContain("disconnect()");
	});

	/**
	 * `open` is documented as "settable to force the hint open". A pointer that wanders over a forced
	 * tip and leaves used to run the ordinary hide path and strip the author's attribute for good, so
	 * the one prop whose whole job is to override hover was the prop hover could delete.
	 */
	it("does not let a passing hover take away a tip the author forced open", () => {
		const element = SURFACES[0].element;
		expect(element).toContain("forcedOpen");
		expect(element).toMatch(/hide = \(\): void => \{[\s\S]*?if \(this\.forcedOpen\) return;/);
	});

	it("leaves --layer-overlay to the one surface still stacking for itself", () => {
		// tooltip and swatch outrank every z-index now; the non-modal sheet is not promoted and still needs one
		expect(tooltipCss).not.toContain("--layer-overlay");
		expect(swatchCss).not.toContain("--layer-overlay");
	});
});

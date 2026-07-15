// @vitest-environment happy-dom
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
// side effect: defines <xtyle-spotlight> (and, through it, <xtyle-popover>) on the happy-dom registry
import "../src/elements/spotlight.js";
import { cutoutPath } from "../src/markup/spotlight.js";
import { spotlightCss } from "../src/css/components/spotlight.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";
import { manifest, fragmentSources } from "../src/elements/fragments/spotlight/source.generated.js";
import { manifest as popoverManifest, fragmentSources as popoverSources } from "../src/elements/fragments/popover/source.generated.js";

type SpotlightEl = HTMLElement & {
	open: boolean;
	target: string | null;
	targetElement: HTMLElement | null;
	padding: number;
	shape: "auto" | "rect" | "circle";
	arrow: "none" | "static" | "bounce";
	noDismiss: boolean;
	show(): void;
	close(): void;
};

const VIEWPORT = { top: 0, left: 0, width: 1000, height: 800 };

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
	await loadFill(popoverManifest, popoverSources);
});

beforeEach(() => {
	const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
	const nativeMatches = HTMLElement.prototype.matches;
	proto.matches = function matches(this: HTMLElement, selector: string): boolean {
		if (selector === ":popover-open") return this.hasAttribute("data-test-open");
		return nativeMatches.call(this, selector);
	};
	proto.showPopover = function showPopover(this: HTMLElement): void {
		this.setAttribute("data-test-open", "");
		this.dispatchEvent(Object.assign(new Event("toggle"), { newState: "open" }));
	};
	proto.hidePopover = function hidePopover(this: HTMLElement): void {
		this.removeAttribute("data-test-open");
		this.dispatchEvent(Object.assign(new Event("toggle"), { newState: "closed" }));
	};
	(window as unknown as { innerWidth: number }).innerWidth = VIEWPORT.width;
	(window as unknown as { innerHeight: number }).innerHeight = VIEWPORT.height;
});

afterEach(() => {
	document.body.innerHTML = "";
});

/** A target with a rect happy-dom will not compute on its own. */
function makeTarget(rect = { top: 100, left: 200, width: 120, height: 40 }): HTMLElement {
	const el = document.createElement("button");
	el.id = "save";
	el.textContent = "Save";
	el.getBoundingClientRect = () =>
		({ ...rect, right: rect.left + rect.width, bottom: rect.top + rect.height, x: rect.left, y: rect.top }) as DOMRect;
	document.body.appendChild(el);
	return el;
}

function make(attrs: Record<string, string> = {}): SpotlightEl {
	const el = document.createElement("xtyle-spotlight") as SpotlightEl;
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	document.body.appendChild(el);
	return el;
}

function root(el: SpotlightEl): ShadowRoot {
	return el.shadowRoot as ShadowRoot;
}

function veil(el: SpotlightEl): HTMLElement {
	return root(el).querySelector("[data-veil]") as HTMLElement;
}

// happy-dom does no layout, so it can't hit-test a real click; these guard the pointer-events invariant
// that made the callout unclickable — the whole fixed layer is `none`, and the content box has to earn `auto`
// back on an element this sheet can actually reach.
describe("the pointer-events invariant", () => {
	it("re-enables the pointer on the spotlight's own panel, not the popover's shadow panel", () => {
		// the panel rule has to grant auto: it is the box the buttons live in, and it inherits none otherwise
		const panelRule = spotlightCss.match(/\.xtyle-spotlight__panel\s*\{[^}]*\}/)?.[0] ?? "";
		expect(panelRule).toContain("pointer-events: auto");
	});

	it("never tries to reach the popover's inner panel across the shadow boundary", () => {
		// `.xtyle-spotlight__callout .xtyle-popover__panel` matches nothing — the panel is in the popover's
		// shadow root — so a rule keyed on it silently fails and every button computes to none
		expect(spotlightCss).not.toContain(".xtyle-spotlight__callout .xtyle-popover__panel");
	});
});

describe("cutoutPath (the pure geometry)", () => {
	it("cuts the viewport minus the target, as two evenodd subpaths", () => {
		const path = cutoutPath({ top: 100, left: 200, width: 120, height: 40 }, VIEWPORT, { padding: 0 });
		expect(path.startsWith("M0 0H1000V800H0Z")).toBe(true);
		expect(path).toContain("M200 100H320V140H200Z");
	});

	it("pads the hole outward from the target on every side", () => {
		const path = cutoutPath({ top: 100, left: 200, width: 120, height: 40 }, VIEWPORT, { padding: 10 });
		expect(path).toContain("M190 90H330V150H190Z");
	});

	it("rounds the hole's corners with arcs rather than faking them with points", () => {
		const path = cutoutPath({ top: 100, left: 200, width: 120, height: 40 }, VIEWPORT, { padding: 0, radius: 8 });
		expect(path).toContain("A8 8 0 0 1");
		expect(path).not.toContain("H320V140"); // no square corner left behind
	});

	it("cuts a real circle, as two arcs — a single 360° arc draws nothing", () => {
		const path = cutoutPath({ top: 100, left: 100, width: 40, height: 40 }, VIEWPORT, { padding: 0, shape: "circle" });
		expect(path).toContain("a20 20 0 1 0 40 0");
		expect(path).toContain("a20 20 0 1 0 -40 0");
	});

	// a hole at the origin is the failure that reads as a bug; a solid veil reads as a design
	it("leaves the veil solid when there is no target, rather than punching a hole at 0,0", () => {
		expect(cutoutPath(null, VIEWPORT)).toBe("M0 0H1000V800H0Z");
	});

	it("leaves the veil solid for a collapsed target — a display:none step is not a hole", () => {
		expect(cutoutPath({ top: 0, left: 0, width: 0, height: 0 }, VIEWPORT)).toBe("M0 0H1000V800H0Z");
	});

	it("never lets the radius exceed the hole it is rounding", () => {
		const path = cutoutPath({ top: 100, left: 100, width: 20, height: 20 }, VIEWPORT, { padding: 0, radius: 999 });
		expect(path).toContain("A10 10 0 0 1");
	});
});

describe("<xtyle-spotlight> the isolation", () => {
	it("cuts the hole over the element the selector names", () => {
		makeTarget();
		const el = make({ target: "#save", padding: "0", shape: "rect", open: "" });
		expect(veil(el).getAttribute("style")).toContain("M200 100H320V140H200Z");
	});

	it("goes solid when the selector names nothing, so a broken target reads as a scrim", () => {
		const el = make({ target: "#nothing-here", open: "" });
		const style = veil(el).getAttribute("style") ?? "";
		expect(style).toContain("M0 0H1000V800H0Z");
		expect(style).not.toContain("Z M"); // no second subpath: no hole
	});

	it("takes an element directly, for a target no selector can name", () => {
		const target = makeTarget({ top: 50, left: 60, width: 100, height: 20 });
		const el = make({ padding: "0", shape: "rect" });
		el.targetElement = target;
		el.show();
		expect(veil(el).getAttribute("style")).toContain("M60 50H160V70H60Z");
	});

	it("hides the whole layer while closed, so a spotlight costs nothing until it is shown", () => {
		makeTarget();
		const el = make({ target: "#save" });
		expect((root(el).querySelector("[data-root]") as HTMLElement).hasAttribute("hidden")).toBe(true);
		el.show();
		expect((root(el).querySelector("[data-root]") as HTMLElement).hasAttribute("hidden")).toBe(false);
	});
});

describe("<xtyle-spotlight> the ring traces the hole", () => {
	function ring(el: SpotlightEl): HTMLElement {
		return root(el).querySelector("[data-ring]") as HTMLElement;
	}

	it("boxes the padded target, for a rect hole", () => {
		makeTarget({ top: 100, left: 200, width: 120, height: 40 });
		const el = make({ target: "#save", padding: "10", shape: "rect", open: "" });
		const style = ring(el).getAttribute("style") ?? "";
		expect(style).toContain("top: 90px");
		expect(style).toContain("left: 190px");
		expect(style).toContain("width: 140px");
		expect(style).toContain("height: 60px");
	});

	// the cut circle is sized from the target's *longest* side, so a ring that merely rounds the target's own
	// box to 50% is an ellipse sitting inside a circle — the two visibly disagree on any non-square target
	it("is a circle, not an ellipse, around a wide target", () => {
		makeTarget({ top: 100, left: 200, width: 120, height: 40 });
		const el = make({ target: "#save", padding: "0", shape: "circle", open: "" });
		const style = ring(el).getAttribute("style") ?? "";
		expect(style).toContain("width: 120px");
		expect(style).toContain("height: 120px");
		expect(style).toContain("border-radius: 50%");
		// centred on the target, so it sits over the same hole the veil cut
		expect(style).toContain("top: 60px");
		expect(style).toContain("left: 200px");
	});
});

describe("<xtyle-spotlight> leaving", () => {
	it("dismisses on a click on the veil — everything else is 'not this'", () => {
		makeTarget();
		const el = make({ target: "#save", open: "" });
		const dismissed: string[] = [];
		el.addEventListener("dismiss", () => dismissed.push("dismiss"));
		veil(el).click();
		expect(el.open).toBe(false);
		expect(dismissed).toEqual(["dismiss"]);
	});

	it("dismisses on the built-in button", () => {
		makeTarget();
		const el = make({ target: "#save", open: "" });
		(root(el).querySelector("[data-sl-close]") as HTMLButtonElement).click();
		expect(el.open).toBe(false);
	});

	it("dismisses on Escape", () => {
		makeTarget();
		const el = make({ target: "#save", open: "" });
		el.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, composed: true, cancelable: true }));
		expect(el.open).toBe(false);
	});

	// a step the app insists on: the veil and Escape go inert, and the way out is the app's to provide
	it("refuses every dismissal under no-dismiss", () => {
		makeTarget();
		const el = make({ target: "#save", open: "", "no-dismiss": "" });
		veil(el).click();
		el.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, composed: true, cancelable: true }));
		(root(el).querySelector("[data-sl-close]") as HTMLButtonElement).click();
		expect(el.open).toBe(true);
	});

	// the callout is a Popover, and a Popover announces itself — so without a muffle its bubbling, composed
	// `open`/`close` land on a consumer listening for the *spotlight's*, and every step announces twice
	it("never lets the callout's own open/close impersonate the spotlight's", () => {
		makeTarget();
		const el = make({ target: "#save" });
		const seen: string[] = [];
		el.addEventListener("open", () => seen.push("open"));
		el.addEventListener("close", () => seen.push("close"));
		el.show();
		expect(seen).toEqual(["open"]);
	});

	it("fires open and close as it comes and goes", () => {
		makeTarget();
		const el = make({ target: "#save" });
		const seen: string[] = [];
		el.addEventListener("open", () => seen.push("open"));
		el.addEventListener("close", () => seen.push("close"));
		el.show();
		el.close();
		expect(seen).toEqual(["open", "close"]);
	});
});

describe("<xtyle-spotlight> the callout", () => {
	it("names the panel from the heading", () => {
		makeTarget();
		const el = make({ target: "#save", heading: "Save as you go", open: "" });
		const heading = root(el).querySelector("[data-sl-title]") as HTMLElement;
		const callout = root(el).querySelector("[data-callout]") as HTMLElement;
		expect(heading.textContent).toBe("Save as you go");
		expect(callout.getAttribute("aria-labelledby")).toBe(heading.id);
		expect(heading.id).not.toBe("");
	});

	it("draws no pointer under arrow=none", () => {
		makeTarget();
		const withArrow = make({ target: "#save", open: "" });
		expect((root(withArrow).querySelector("[data-pointer]") as HTMLElement).hasAttribute("hidden")).toBe(false);

		const without = make({ target: "#save", arrow: "none", open: "" });
		expect((root(without).querySelector("[data-pointer]") as HTMLElement).hasAttribute("hidden")).toBe(true);
	});

	// the fill's paint reaches its markers via querySelector across the whole render root, which includes the
	// slotted actions — so an author who put `data-close` on their own button used to have its label rewritten
	// to "Got it" and the button hidden. The fill's markers are namespaced now; the author's are untouched.
	it("never rewrites a slotted button that happens to carry a data-close of its own", () => {
		makeTarget();
		const el = make({ target: "#save", open: "" });
		const own = document.createElement("button");
		own.setAttribute("slot", "actions");
		own.setAttribute("data-close", "my-thing");
		own.textContent = "Not now";
		el.appendChild(own);
		el.close();
		el.show();
		expect(own.textContent).toBe("Not now");
		expect(own.hasAttribute("hidden")).toBe(false);
	});
});

describe("<xtyle-spotlight> SSR (the pre-hydration paint)", () => {
	it("renders the veil, the callout and the slots without a runtime", async () => {
		const html = await renderFragmentLight("spotlight", {
			open: false,
			heading: "Save as you go",
			arrow: "bounce",
			headingId: "h1",
		});
		expect(html).toContain("xtyle-spotlight__veil");
		expect(html).toContain("<slot></slot>");
		expect(html).toContain('<slot name="actions"></slot>');
		expect(html).toContain("Save as you go");
	});
});

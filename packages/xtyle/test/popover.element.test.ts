// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
// side effect: defines the <xtyle-popover> custom element on the happy-dom registry
import "../src/elements/popover.js";
import type { PopoverOpenOptions } from "../src/elements/popover.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";
import { manifest, fragmentSources } from "../src/elements/fragments/popover/source.generated.js";

type PopoverEl = HTMLElement & {
	open: boolean;
	arrow: boolean;
	modal: boolean;
	show(opts?: PopoverOpenOptions): void;
	openAt(x: number, y: number, opts?: PopoverOpenOptions): void;
	openFrom(anchor: HTMLElement, opts?: PopoverOpenOptions): void;
	hide(reason?: string, returnFocus?: boolean): void;
	toggle(): void;
	reposition(): void;
};

const OPEN_FLAG = "data-test-popover-open";

/** Which door the panel actually went up through, recorded by the `<dialog>` stub below — the modal
 * posture is only real when it is `showModal`. */
type StubDialog = HTMLDialogElement & { modalDoor?: boolean };

/** happy-dom 15 ships no Popover API and no top-layer `<dialog>` machinery, so both doors the panel can
 * open through are stood in down to the observable half the element depends on: `:popover-open` plus the
 * async-in-the-browser `toggle` event for the popover door, and `open` plus the `close` event for the
 * dialog one. `modalDoor` records which was used, so the tests can prove the modal posture really goes
 * through `showModal()` and not through a popover wearing an `aria-modal`. */
beforeAll(async () => {
	const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
	const nativeMatches = HTMLElement.prototype.matches;
	proto.matches = function matches(this: HTMLElement, selector: string): boolean {
		if (selector === ":popover-open") return this.hasAttribute(OPEN_FLAG);
		return nativeMatches.call(this, selector);
	};
	const toggle = (el: HTMLElement, newState: "open" | "closed"): void => {
		el.dispatchEvent(Object.assign(new Event("toggle"), { newState }));
	};
	proto.showPopover = function showPopover(this: HTMLElement): void {
		if (this.hasAttribute(OPEN_FLAG)) return;
		this.setAttribute(OPEN_FLAG, "");
		toggle(this, "open");
	};
	proto.hidePopover = function hidePopover(this: HTMLElement): void {
		if (!this.hasAttribute(OPEN_FLAG)) return;
		this.removeAttribute(OPEN_FLAG);
		toggle(this, "closed");
	};

	const dialog = window.HTMLDialogElement.prototype as unknown as StubDialog;
	dialog.showModal = function showModal(this: StubDialog): void {
		this.open = true;
		this.modalDoor = true;
	};
	dialog.show = function show(this: StubDialog): void {
		this.open = true;
		this.modalDoor = false;
	};
	dialog.close = function close(this: StubDialog): void {
		if (!this.open) return;
		this.open = false;
		this.modalDoor = false;
		this.dispatchEvent(new Event("close"));
	};

	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
	vi.restoreAllMocks();
});

/** A popover with a slotted trigger and a slotted body. */
function make(attrs: Record<string, string> = {}, body = "<button id='act'>Act</button>"): PopoverEl {
	const el = document.createElement("xtyle-popover") as PopoverEl;
	for (const [name, value] of Object.entries({ label: "Panel", ...attrs })) el.setAttribute(name, value);
	el.innerHTML = `<button slot="trigger" id="trig">Open</button>${body}`;
	document.body.appendChild(el);
	return el;
}

/** A triggerless popover — the point-anchored / `openFrom` shape. */
function bare(attrs: Record<string, string> = {}, body = "<button id='act'>Act</button>"): PopoverEl {
	const el = document.createElement("xtyle-popover") as PopoverEl;
	for (const [name, value] of Object.entries({ label: "Panel", ...attrs })) el.setAttribute(name, value);
	el.innerHTML = body;
	document.body.appendChild(el);
	return el;
}

function root(el: PopoverEl): ShadowRoot {
	return el.shadowRoot as ShadowRoot;
}

function panel(el: PopoverEl): StubDialog {
	return root(el).querySelector(".xtyle-popover__panel") as StubDialog;
}

function triggerRegion(el: PopoverEl): HTMLElement {
	return root(el).querySelector(".xtyle-popover__trigger") as HTMLElement;
}

function arrow(el: PopoverEl): HTMLElement {
	return root(el).querySelector(".xtyle-popover__arrow") as HTMLElement;
}

function isShown(el: PopoverEl): boolean {
	return panel(el).hasAttribute(OPEN_FLAG) || panel(el).open;
}

function trigger(el: PopoverEl): HTMLElement {
	return el.querySelector("#trig") as HTMLElement;
}

function stubRect(el: HTMLElement, rect: { top: number; left: number; width: number; height: number }): void {
	el.getBoundingClientRect = () =>
		({ ...rect, right: rect.left + rect.width, bottom: rect.top + rect.height, x: rect.left, y: rect.top }) as DOMRect;
}

function click(el: HTMLElement): void {
	el.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, cancelable: true }));
}

function closeReasons(el: PopoverEl): string[] {
	const seen: string[] = [];
	el.addEventListener("close", (event) => seen.push((event as CustomEvent).detail.reason));
	return seen;
}

describe("<xtyle-popover> trigger anchoring", () => {
	it("opens on a trigger click, placed against the trigger, synchronously — no first-frame flash at 0,0", () => {
		const el = make();
		stubRect(triggerRegion(el), { top: 200, left: 120, width: 90, height: 32 });
		click(trigger(el));
		expect(el.open).toBe(true);
		expect(isShown(el)).toBe(true);
		// bottom of the trigger + the default 8px gap; centered on it, with the 224px fallback width
		expect(panel(el).style.top).toBe("240px");
		expect(panel(el).style.left).toBe("53px");
		expect(panel(el).getAttribute("data-placement")).toBe("bottom");
	});

	it("closes on a second trigger click rather than reopening", () => {
		const el = make();
		stubRect(triggerRegion(el), { top: 200, left: 120, width: 90, height: 32 });
		click(trigger(el));
		click(trigger(el));
		expect(el.open).toBe(false);
		expect(isShown(el)).toBe(false);
	});

	it("swallows the trigger click that is really the tail of the light-dismiss that just closed it", () => {
		const el = make();
		stubRect(triggerRegion(el), { top: 200, left: 120, width: 90, height: 32 });
		click(trigger(el));
		// the browser's light-dismiss fires first: the panel is already gone by the time the click lands
		panel(el).hidePopover();
		expect(el.open).toBe(false);
		click(trigger(el));
		expect(el.open).toBe(false);
	});

	it("stamps the disclosure state on the trigger and clears it on close", () => {
		const el = make();
		expect(trigger(el).getAttribute("aria-haspopup")).toBe("dialog");
		expect(trigger(el).getAttribute("aria-expanded")).toBe("false");
		expect(trigger(el).getAttribute("aria-controls")).toBe(panel(el).id);
		el.show();
		expect(trigger(el).getAttribute("aria-expanded")).toBe("true");
		el.hide();
		expect(trigger(el).getAttribute("aria-expanded")).toBe("false");
	});

	it("stamps the state on the real control inside a wrapper trigger, not on the wrapper", () => {
		const el = document.createElement("xtyle-popover") as PopoverEl;
		el.setAttribute("label", "Panel");
		el.innerHTML = `<span slot="trigger"><button id="inner">Open</button></span>`;
		document.body.appendChild(el);
		const inner = el.querySelector("#inner") as HTMLElement;
		expect(inner.getAttribute("aria-expanded")).toBe("false");
		expect((el.querySelector('[slot="trigger"]') as HTMLElement).hasAttribute("aria-expanded")).toBe(false);
	});

	it("advertises the panel's real role on the trigger when it is not a dialog", () => {
		const el = make({ "panel-role": "listbox" });
		expect(trigger(el).getAttribute("aria-haspopup")).toBe("listbox");
		expect(panel(el).getAttribute("role")).toBe("listbox");
	});
});

describe("<xtyle-popover>.openAt (the point anchor)", () => {
	it("opens at the cursor point, leading edge on it", () => {
		const el = bare();
		el.openAt(300, 220);
		expect(el.open).toBe(true);
		expect(panel(el).style.left).toBe("300px");
		expect(panel(el).style.top).toBe("228px");
	});

	it("right-aligns at the cursor near the right edge instead of sliding off it", () => {
		const el = bare();
		el.openAt(window.innerWidth - 24, 100);
		expect(panel(el).style.left).toBe(`${window.innerWidth - 24 - 224}px`);
	});

	it("honors an explicit placement and align", () => {
		const el = bare();
		el.openAt(500, 400, { placement: "top", align: "end" });
		expect(panel(el).style.left).toBe(`${500 - 224}px`);
		expect(panel(el).style.top).toBe(`${400 - 8}px`);
		expect(panel(el).getAttribute("data-placement")).toBe("top");
	});

	it("drops the point anchor on close, so the trigger path anchors to the trigger again", () => {
		const el = make();
		stubRect(triggerRegion(el), { top: 200, left: 120, width: 90, height: 32 });
		el.openAt(400, 400);
		expect(panel(el).style.left).toBe("400px");
		el.hide();
		click(trigger(el));
		expect(panel(el).style.left).toBe("53px");
	});
});

describe("<xtyle-popover>.openFrom (the substrate hook)", () => {
	it("anchors to an element the caller owns and holds it until close", () => {
		const input = document.createElement("input");
		document.body.appendChild(input);
		stubRect(input, { top: 100, left: 40, width: 300, height: 36 });
		const el = bare();
		el.openFrom(input, { align: "start", focus: "none" });
		expect(panel(el).style.top).toBe("144px");
		expect(panel(el).style.left).toBe("40px");
		expect(document.activeElement).not.toBe(el.querySelector("#act"));
	});

	it("re-places against the held anchor when the content resizes", () => {
		const input = document.createElement("input");
		document.body.appendChild(input);
		stubRect(input, { top: 100, left: 40, width: 300, height: 36 });
		const el = bare();
		el.openFrom(input, { align: "start", focus: "none" });
		stubRect(input, { top: 300, left: 40, width: 300, height: 36 });
		el.reposition();
		expect(panel(el).style.top).toBe("344px");
	});

	it("anchors to a `for` element declared elsewhere in the document, and that element toggles it", () => {
		const external = document.createElement("button");
		external.id = "external-trigger";
		document.body.appendChild(external);
		stubRect(external, { top: 500, left: 200, width: 100, height: 40 });
		const el = bare({ for: "external-trigger" });
		click(external);
		expect(el.open).toBe(true);
		expect(panel(el).style.top).toBe("548px");
		expect(external.getAttribute("aria-expanded")).toBe("true");
	});
});

describe("<xtyle-popover> the arrow", () => {
	it("is off by default and drawn when asked", () => {
		expect(arrow(make()).hasAttribute("hidden")).toBe(true);
		expect(arrow(make({ arrow: "" })).hasAttribute("hidden")).toBe(false);
	});

	it("points at the anchor's center even when the panel is start-aligned", () => {
		const el = make({ arrow: "", align: "start" });
		stubRect(triggerRegion(el), { top: 200, left: 120, width: 90, height: 32 });
		el.show();
		expect(panel(el).style.left).toBe("120px");
		// the trigger's center (165) sits 45px into a panel whose left edge is on the trigger's
		expect(panel(el).style.getPropertyValue("--xtyle-pop-arrow")).toBe("45px");
	});

	it("is a real node in the fragment, not a pseudo-element", () => {
		expect(arrow(make({ arrow: "" }))).toBeInstanceOf(HTMLElement);
		expect(arrow(make({ arrow: "" })).getAttribute("aria-hidden")).toBe("true");
	});
});

describe("<xtyle-popover> focus", () => {
	it("takes the first focusable node in the panel by default", () => {
		const el = make();
		el.show();
		expect(document.activeElement).toBe(el.querySelector("#act"));
	});

	it("takes the panel itself on `focus: \"panel\"`", () => {
		const el = make();
		el.show({ focus: "panel" });
		expect(root(el).activeElement).toBe(panel(el));
	});

	it("leaves focus alone on `focus: \"none\"` — what a type-ahead surface needs", () => {
		const el = make();
		trigger(el).focus();
		el.show({ focus: "none" });
		expect(document.activeElement).toBe(trigger(el));
	});

	it("honors the focus-on-open attribute", () => {
		const el = make({ "focus-on-open": "none" });
		trigger(el).focus();
		el.show();
		expect(document.activeElement).toBe(trigger(el));
	});

	it("returns focus to wherever it was when the panel opened", () => {
		const host = document.createElement("button");
		document.body.appendChild(host);
		host.focus();
		const el = bare();
		el.openAt(50, 50);
		expect(document.activeElement).toBe(el.querySelector("#act"));
		el.hide();
		expect(document.activeElement).toBe(host);
	});

	it("hands focus back rather than stranding it on the body when light-dismissed", () => {
		const host = document.createElement("button");
		document.body.appendChild(host);
		host.focus();
		const el = bare();
		el.openAt(50, 50);
		panel(el).hidePopover();
		expect(document.activeElement).toBe(host);
	});

	it("never moves focus when the panel is opened through the `open` attribute", () => {
		const host = document.createElement("button");
		document.body.appendChild(host);
		host.focus();
		const el = make();
		el.open = true;
		expect(isShown(el)).toBe(true);
		expect(document.activeElement).toBe(host);
	});
});

describe("<xtyle-popover> the modal posture", () => {
	it("marks the panel modal so the scrim paints and the role is announced", () => {
		const el = make({ modal: "" });
		expect(panel(el).getAttribute("data-modal")).toBe("true");
		expect(panel(el).getAttribute("aria-modal")).toBe("true");
	});

	it("leaves a non-modal panel unmarked", () => {
		const el = make();
		expect(panel(el).hasAttribute("data-modal")).toBe(false);
		expect(panel(el).hasAttribute("aria-modal")).toBe(false);
	});

	it("opens through `<dialog>.showModal()`, so the inertness `aria-modal` claims is the platform's", () => {
		const el = make({ modal: "" });
		el.show();
		expect(panel(el).tagName).toBe("DIALOG");
		expect(panel(el).modalDoor).toBe(true);
		expect(panel(el).open).toBe(true);
		expect(panel(el).hasAttribute(OPEN_FLAG)).toBe(false);
		expect(panel(el).getAttribute("aria-modal")).toBe("true");
	});

	it("opens a non-modal panel through the Popover API instead, and claims no modality", () => {
		const el = make();
		el.show();
		expect(panel(el).hasAttribute(OPEN_FLAG)).toBe(true);
		expect(panel(el).open).toBe(false);
		expect(panel(el).modalDoor).toBeUndefined();
		expect(panel(el).hasAttribute("aria-modal")).toBe(false);
	});

	it("closes the modal panel through the dialog's own door, and says why", () => {
		const el = make({ modal: "" });
		const reasons = closeReasons(el);
		el.show();
		el.hide();
		expect(panel(el).open).toBe(false);
		expect(el.open).toBe(false);
		expect(reasons).toEqual(["api"]);
	});

	it("reports `escape` when the platform cancels the modal dialog", () => {
		const el = make({ modal: "" });
		const reasons = closeReasons(el);
		el.show();
		panel(el).dispatchEvent(new Event("cancel"));
		panel(el).close();
		expect(reasons).toEqual(["escape"]);
	});

	it("strikes the `aria-modal` claim when the panel is not a dialog the platform can make inert", () => {
		// a third-party fill whose panel is a plain box: the top layer alone never makes the page inert,
		// so the modal posture degrades to the popover door rather than asserting an inertness it lacks
		const proto = window.HTMLDialogElement.prototype as unknown as Record<string, unknown>;
		const showModal = proto.showModal;
		proto.showModal = undefined;
		try {
			const el = make({ modal: "" });
			el.show();
			expect(panel(el).hasAttribute(OPEN_FLAG)).toBe(true);
			expect(panel(el).open).toBe(false);
			expect(panel(el).hasAttribute("aria-modal")).toBe(false);
			expect(panel(el).getAttribute("data-modal")).toBe("true");
		} finally {
			proto.showModal = showModal;
		}
	});

	it("re-postures an open panel when `modal` is flipped, without announcing the swap", () => {
		const el = make();
		let opened = 0;
		const reasons = closeReasons(el);
		el.addEventListener("open", () => opened++);
		el.show();
		expect(opened).toBe(1);
		expect(panel(el).hasAttribute(OPEN_FLAG)).toBe(true);

		el.modal = true;
		expect(panel(el).modalDoor).toBe(true);
		expect(panel(el).open).toBe(true);
		expect(panel(el).hasAttribute(OPEN_FLAG)).toBe(false);
		expect(el.open).toBe(true);
		expect(opened).toBe(1);
		expect(reasons).toEqual([]);
	});

	it("swallows a pointer landing outside, so the control it hit does not also fire", () => {
		const el = make({ modal: "" });
		const outside = document.createElement("button");
		let fired = 0;
		outside.addEventListener("click", () => fired++);
		document.body.appendChild(outside);
		el.show();

		outside.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, composed: true, cancelable: true }));
		click(outside);

		expect(el.open).toBe(false);
		expect(fired).toBe(0);
	});

	it("lets a pointer through to the page when it is not modal", () => {
		const el = make();
		const outside = document.createElement("button");
		let fired = 0;
		outside.addEventListener("click", () => fired++);
		document.body.appendChild(outside);
		el.show();

		outside.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, composed: true, cancelable: true }));
		click(outside);

		expect(fired).toBe(1);
	});

	it("traps Tab inside the panel, wrapping from the last focusable back to the first", () => {
		const el = make({ modal: "" }, "<button id='act'>Act</button><button id='act2'>Also</button>");
		el.show();
		const last = el.querySelector("#act2") as HTMLElement;
		last.focus();
		const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, composed: true, cancelable: true });
		panel(el).dispatchEvent(event);
		expect(event.defaultPrevented).toBe(true);
		expect(document.activeElement).toBe(el.querySelector("#act"));
	});

	it("does not trap Tab in the non-modal posture — a disclosure surface lets the keyboard walk out", () => {
		const el = make({}, "<button id='act'>Act</button><button id='act2'>Also</button>");
		el.show();
		(el.querySelector("#act2") as HTMLElement).focus();
		const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, composed: true, cancelable: true });
		panel(el).dispatchEvent(event);
		expect(event.defaultPrevented).toBe(false);
	});
});

describe("<xtyle-popover> close discipline", () => {
	it("reports `escape` when Escape closed it", () => {
		const el = make();
		const reasons = closeReasons(el);
		el.show();
		panel(el).dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, composed: true }));
		// the native popover then hides itself
		panel(el).hidePopover();
		expect(reasons).toEqual(["escape"]);
	});

	it("reports `dismiss` for a light-dismiss", () => {
		const el = make();
		const reasons = closeReasons(el);
		el.show();
		panel(el).hidePopover();
		expect(reasons).toEqual(["dismiss"]);
	});

	it("reports `api` for a programmatic close", () => {
		const el = make();
		const reasons = closeReasons(el);
		el.show();
		el.hide();
		expect(reasons).toEqual(["api"]);
	});

	it("closes on a `select` bubbling out of the panel, and says so", () => {
		const el = make();
		const reasons = closeReasons(el);
		el.show();
		(el.querySelector("#act") as HTMLElement).dispatchEvent(
			new CustomEvent("select", { bubbles: true, composed: true, detail: { value: "x" } }),
		);
		expect(el.open).toBe(false);
		expect(reasons).toEqual(["select"]);
	});

	it("stays open on a `select` when told to", () => {
		const el = make({ "no-close-on-select": "" });
		el.show();
		(el.querySelector("#act") as HTMLElement).dispatchEvent(new CustomEvent("select", { bubbles: true, composed: true }));
		expect(el.open).toBe(true);
	});

	it("never mistakes an input's text-selection `select` for a choice", () => {
		const el = make({}, "<input id='text' />");
		el.show();
		(el.querySelector("#text") as HTMLElement).dispatchEvent(new Event("select", { bubbles: true, composed: true }));
		expect(el.open).toBe(true);
	});

	it("fires `open` once the panel is in the top layer", () => {
		const el = make();
		let opened = 0;
		el.addEventListener("open", () => opened++);
		el.show();
		expect(opened).toBe(1);
	});
});

describe("<xtyle-popover> SSR (the pre-hydration paint)", () => {
	const ssr = (bindings: Record<string, unknown>): Promise<string> =>
		renderFragmentLight("popover", {
			panelId: "p",
			hasTrigger: true,
			arrow: false,
			modal: false,
			flush: false,
			panelRole: "dialog",
			label: "Panel",
			labelledby: null,
			...bindings,
		});

	it("ships the panel named, roled, and closed", async () => {
		const html = await ssr({});
		expect(html).toContain('id="p"');
		expect(html).toContain('role="dialog"');
		expect(html).toContain('aria-label="Panel"');
		expect(html).toContain("popover");
	});

	it("hides the trigger box when nothing is slotted into it, so no empty box flashes", async () => {
		const html = await ssr({ hasTrigger: false });
		expect(html).toMatch(/<span[^>]*data-trigger[^>]*\bhidden="hidden"/);
	});

	it("ships the arrow hidden unless it was asked for", async () => {
		expect(await ssr({})).toMatch(/<span[^>]*data-arrow[^>]*\bhidden="hidden"/);
		expect(await ssr({ arrow: true })).not.toMatch(/<span[^>]*data-arrow[^>]*\bhidden="hidden"/);
	});

	it("marks the modal panel and the flush root", async () => {
		const html = await ssr({ modal: true, flush: true });
		expect(html).toContain('data-modal="true"');
		expect(html).toContain('aria-modal="true"');
		expect(html).toContain("xtyle-popover--flush");
	});
});

describe("<xtyle-popover> naming", () => {
	it("warns when a dialog-role panel has no accessible name", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const el = document.createElement("xtyle-popover");
		document.body.appendChild(el);
		expect(warn).toHaveBeenCalled();
	});

	it("stays quiet when the panel's content brings its own semantics", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const el = document.createElement("xtyle-popover");
		el.setAttribute("panel-role", "listbox");
		document.body.appendChild(el);
		expect(warn).not.toHaveBeenCalled();
	});
});

// @vitest-environment happy-dom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
// side effect: defines the <xtyle-sheet> custom element on the happy-dom registry
import "../src/elements/sheet.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/sheet/source.generated.js";

type SheetEl = HTMLElement & {
	open: boolean;
	side: string;
	size: string;
	nonModal: boolean;
	noSwipe: boolean;
	showModal(): void;
	show(): void;
	close(): void;
};

/** Warm the shared fill so every element render below applies its ops synchronously. */
beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});

/**
 * happy-dom implements `<dialog>` open/close but not the top-layer modal machinery, so
 * `showModal` / `show` / `close` are stubbed down to the observable half the element depends on:
 * the `open` property and the `close` event. `modal` records which door was used.
 */
type StubDialog = HTMLDialogElement & { modal?: boolean };

beforeEach(() => {
	const proto = window.HTMLDialogElement.prototype as unknown as StubDialog;
	proto.showModal = function (this: StubDialog) {
		this.open = true;
		this.modal = true;
	};
	proto.show = function (this: StubDialog) {
		this.open = true;
		this.modal = false;
	};
	proto.close = function (this: StubDialog) {
		if (!this.open) return;
		this.open = false;
		this.dispatchEvent(new Event("close"));
	};
});

afterEach(() => {
	document.body.innerHTML = "";
	vi.restoreAllMocks();
});

function make(attrs: Record<string, string> = { heading: "Filters" }): SheetEl {
	const el = document.createElement("xtyle-sheet") as SheetEl;
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	document.body.appendChild(el);
	return el;
}

/** A bare-created element resolves `auto` to a shadow root, so the fill's chrome lives there. */
function root(el: SheetEl): ShadowRoot {
	return el.shadowRoot as ShadowRoot;
}

function dialogOf(el: SheetEl): StubDialog {
	const dialog = root(el).querySelector("dialog") as StubDialog | null;
	expect(dialog, "the fill renders a native <dialog>").not.toBeNull();
	return dialog as StubDialog;
}

function pointer(type: string, init: { clientX?: number; clientY?: number; pointerId?: number } = {}): Event {
	const event = new Event(type, { bubbles: true, composed: true, cancelable: true });
	Object.assign(event, { pointerId: 1, pointerType: "touch", button: 0, ...init });
	return event;
}

/** Pin the panel's measured extent — happy-dom lays nothing out, so every rect is 0×0. */
function stubExtent(el: SheetEl, width: number, height: number): void {
	const dialog = dialogOf(el);
	dialog.getBoundingClientRect = () =>
		({ width, height, top: 0, left: 0, right: width, bottom: height, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
}

function handleOf(el: SheetEl): Element {
	const handle = root(el).querySelector("[data-handle]") ?? root(el).querySelector("[data-handle-region]");
	expect(handle, "the fill renders a drag surface").not.toBeNull();
	return handle as Element;
}

function swipe(el: SheetEl, from: { x: number; y: number }, to: { x: number; y: number }): void {
	const handle = handleOf(el);
	handle.dispatchEvent(pointer("pointerdown", { clientX: from.x, clientY: from.y }));
	handle.dispatchEvent(pointer("pointermove", { clientX: to.x, clientY: to.y }));
	handle.dispatchEvent(pointer("pointerup", { clientX: to.x, clientY: to.y }));
}

describe("the sheet's chrome comes from the fragment", () => {
	it("renders the native dialog, the panel, the handle, the header, and the close button", () => {
		const el = make();
		const dialog = dialogOf(el);
		expect(dialog.classList.contains("xtyle-sheet")).toBe(true);
		expect(root(el).querySelector(".xtyle-sheet__panel")).not.toBeNull();
		expect(root(el).querySelector(".xtyle-sheet__handle")).not.toBeNull();
		expect(root(el).querySelector(".xtyle-sheet__grabber")).not.toBeNull();
		expect(root(el).querySelector(".xtyle-sheet__header")).not.toBeNull();
		expect(root(el).querySelector(".xtyle-sheet__body")).not.toBeNull();
		expect(root(el).querySelector(".xtyle-sheet__footer")).not.toBeNull();
		expect(root(el).querySelector(".xtyle-sheet__close")).not.toBeNull();
	});

	// The grabber is a PART, not a finish: a mod has to be able to replace it, which a `::before`
	// with a `content:` could never allow. Guard that it is real markup inside the handle.
	it("draws the grabber as real markup, never as a stylesheet pseudo-element", () => {
		const el = make();
		const grabber = root(el).querySelector(".xtyle-sheet__grabber") as HTMLElement;
		expect(grabber.tagName).toBe("SPAN");
		expect(grabber.getAttribute("part")).toBe("grabber");
		expect(root(el).querySelector("[data-handle]")!.contains(grabber)).toBe(true);
	});

	it("exposes every invented part for a consumer to reach", () => {
		const el = make();
		const parts = [...root(el).querySelectorAll("[part]")].map((n) => n.getAttribute("part"));
		expect(parts).toEqual(
			expect.arrayContaining(["sheet", "handle", "grabber", "panel", "header", "body", "footer", "close"]),
		);
	});

	it("projects the consumer's body and footer content through the fill's slots", () => {
		const el = make();
		expect(root(el).querySelector(".xtyle-sheet__body slot:not([name])")).not.toBeNull();
		expect(root(el).querySelector('.xtyle-sheet__footer slot[name="footer"]')).not.toBeNull();
		expect(root(el).querySelector('.xtyle-sheet__header slot[name="header"]')).not.toBeNull();
	});
});

describe("side and size", () => {
	it("defaults to a bottom sheet at md", () => {
		const el = make();
		expect(el.side).toBe("bottom");
		expect(el.size).toBe("md");
		const dialog = dialogOf(el);
		expect(dialog.classList.contains("xtyle-sheet--bottom")).toBe(true);
		expect(dialog.classList.contains("xtyle-sheet--md")).toBe(false);
	});

	for (const side of ["top", "right", "bottom", "left"] as const) {
		it(`anchors to the ${side} edge`, () => {
			const el = make({ heading: "Panel", side });
			expect(dialogOf(el).classList.contains(`xtyle-sheet--${side}`)).toBe(true);
		});
	}

	for (const size of ["sm", "lg", "full"] as const) {
		it(`carries the ${size} size class`, () => {
			const el = make({ heading: "Panel", size });
			expect(dialogOf(el).classList.contains(`xtyle-sheet--${size}`)).toBe(true);
		});
	}

	it("patches the class in place when the side changes on a live sheet", () => {
		const el = make();
		const before = dialogOf(el);
		el.side = "right";
		const after = dialogOf(el);
		expect(after).toBe(before);
		expect(after.classList.contains("xtyle-sheet--right")).toBe(true);
		expect(after.classList.contains("xtyle-sheet--bottom")).toBe(false);
	});
});

describe("open and close", () => {
	it("opens modal by default and reflects the open attribute", () => {
		const el = make();
		el.showModal();
		expect(el.hasAttribute("open")).toBe(true);
		const dialog = dialogOf(el);
		expect(dialog.open).toBe(true);
		expect(dialog.modal).toBe(true);
	});

	it("opens non-modally through show() when the posture says so", () => {
		const el = make({ heading: "Inspector", "non-modal": "" });
		el.showModal();
		expect(dialogOf(el).modal).toBe(false);
		expect(dialogOf(el).classList.contains("xtyle-sheet--non-modal")).toBe(true);
	});

	it("closes on the close button, clearing the open state and firing close", () => {
		const el = make();
		const closed = vi.fn();
		el.addEventListener("close", closed);
		el.showModal();
		root(el).querySelector<HTMLButtonElement>(".xtyle-sheet__close")!.click();
		expect(el.open).toBe(false);
		expect(dialogOf(el).open).toBe(false);
		expect(closed).toHaveBeenCalledTimes(1);
	});

	it("closes on a scrim click — a click whose target is the dialog itself", () => {
		const el = make();
		el.showModal();
		dialogOf(el).dispatchEvent(new Event("click", { bubbles: true, composed: true }));
		expect(el.open).toBe(false);
	});

	it("keeps a click inside the panel from closing the sheet", () => {
		const el = make();
		el.showModal();
		root(el).querySelector(".xtyle-sheet__body")!.dispatchEvent(new Event("click", { bubbles: true, composed: true }));
		expect(el.open).toBe(true);
	});

	it("restores the sheet to its home in the tree after the portal to body", () => {
		const host = document.createElement("section");
		document.body.appendChild(host);
		const el = document.createElement("xtyle-sheet") as SheetEl;
		el.setAttribute("heading", "Filters");
		host.appendChild(el);

		el.showModal();
		expect(el.parentElement).toBe(document.body);
		el.close();
		expect(el.parentElement).toBe(host);
	});
});

describe("accessible naming and keyboard", () => {
	it("wires the heading to the dialog with aria-labelledby", () => {
		const el = make({ heading: "Filters" });
		const dialog = dialogOf(el);
		const titleId = dialog.getAttribute("aria-labelledby");
		expect(titleId).toBeTruthy();
		expect(root(el).querySelector(`#${titleId}`)!.textContent).toBe("Filters");
	});

	it("names a header-slot sheet with aria-label instead", () => {
		const el = make({ label: "Terms of service" });
		const dialog = dialogOf(el);
		expect(dialog.getAttribute("aria-label")).toBe("Terms of service");
		expect(dialog.hasAttribute("aria-labelledby")).toBe(false);
	});

	it("warns when a sheet has no accessible name at all", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		make({});
		expect(warn).toHaveBeenCalledWith(expect.stringContaining("no accessible name"));
	});

	it("labels the close button, hides its glyph, and honors closeLabel", () => {
		const el = make({ heading: "Filters", "close-label": "Dismiss filters" });
		const close = root(el).querySelector(".xtyle-sheet__close")!;
		expect(close.getAttribute("aria-label")).toBe("Dismiss filters");
		expect(close.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
	});

	// The platform only closes a *modal* dialog on Escape, so a non-modal sheet would have no keyboard
	// exit at all if the element did not wire the key itself.
	it("closes a non-modal sheet on Escape, the key the platform ignores there", () => {
		const el = make({ heading: "Inspector", "non-modal": "" });
		const cancelled = vi.fn();
		el.addEventListener("cancel", cancelled);
		el.showModal();
		dialogOf(el).dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
		expect(el.open).toBe(false);
		expect(cancelled).toHaveBeenCalledTimes(1);
	});

	it("leaves Escape to the platform on a modal sheet", () => {
		const el = make();
		el.showModal();
		const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
		dialogOf(el).dispatchEvent(event);
		expect(event.defaultPrevented).toBe(false);
		expect(el.open).toBe(true);
	});

	it("drops the close button under no-close-button, and the grabber under no-grabber", () => {
		const el = make({ heading: "Confirm", "no-close-button": "", "no-grabber": "" });
		expect(root(el).querySelector(".xtyle-sheet__close")).toBeNull();
		expect(root(el).querySelector("[data-handle]")).toBeNull();
		expect(root(el).querySelector(".xtyle-sheet__grabber")).toBeNull();
	});

	it("hides the grabber from assistive tech, since it duplicates a reachable path", () => {
		const el = make();
		const handle = root(el).querySelector("[data-handle]")!;
		expect(handle.getAttribute("aria-hidden")).toBe("true");
		expect(handle.hasAttribute("tabindex")).toBe(false);
	});
});

describe("swipe to dismiss", () => {
	it("dismisses a bottom sheet dragged far enough toward its edge", () => {
		const el = make();
		el.showModal();
		stubExtent(el, 400, 400);
		swipe(el, { x: 200, y: 100 }, { x: 200, y: 260 });
		expect(el.open).toBe(false);
	});

	it("springs a short drag back instead of dismissing, clearing the transform", () => {
		const el = make();
		el.showModal();
		stubExtent(el, 400, 400);
		swipe(el, { x: 200, y: 100 }, { x: 200, y: 120 });
		expect(el.open).toBe(true);
		expect(dialogOf(el).style.transform).toBe("");
		expect(dialogOf(el).hasAttribute("data-dragging")).toBe(false);
	});

	it("ignores a drag away from the anchored edge", () => {
		const el = make();
		el.showModal();
		stubExtent(el, 400, 400);
		swipe(el, { x: 200, y: 300 }, { x: 200, y: 20 });
		expect(el.open).toBe(true);
	});

	it("tracks the pointer mid-drag and marks the panel dragging", () => {
		const el = make();
		el.showModal();
		stubExtent(el, 400, 400);
		const handle = handleOf(el);
		handle.dispatchEvent(pointer("pointerdown", { clientX: 200, clientY: 100 }));
		handle.dispatchEvent(pointer("pointermove", { clientX: 200, clientY: 150 }));
		const dialog = dialogOf(el);
		expect(dialog.getAttribute("data-dragging")).toBe("");
		expect(dialog.style.transform).toBe("translateY(50px)");
		handle.dispatchEvent(pointer("pointerup", { clientX: 200, clientY: 150 }));
	});

	it("swipes a right-side sheet along the horizontal axis", () => {
		const el = make({ heading: "Inspector", side: "right" });
		el.showModal();
		stubExtent(el, 320, 800);
		swipe(el, { x: 100, y: 400 }, { x: 260, y: 400 });
		expect(el.open).toBe(false);
	});

	it("swipes a left-side sheet the other way, and ignores the inward drag", () => {
		const el = make({ heading: "Nav", side: "left" });
		el.showModal();
		stubExtent(el, 320, 800);
		swipe(el, { x: 200, y: 400 }, { x: 300, y: 400 });
		expect(el.open).toBe(true);
		swipe(el, { x: 200, y: 400 }, { x: 40, y: 400 });
		expect(el.open).toBe(false);
	});

	it("never starts a drag from the scrolling body — the scroll stays a scroll", () => {
		const el = make();
		el.showModal();
		stubExtent(el, 400, 400);
		const body = root(el).querySelector(".xtyle-sheet__body")!;
		body.dispatchEvent(pointer("pointerdown", { clientX: 200, clientY: 100 }));
		body.dispatchEvent(pointer("pointermove", { clientX: 200, clientY: 380 }));
		body.dispatchEvent(pointer("pointerup", { clientX: 200, clientY: 380 }));
		expect(el.open).toBe(true);
		expect(dialogOf(el).style.transform).toBe("");
	});

	it("never starts a drag from an interactive control in the header — the press stays a press", () => {
		const el = make();
		el.showModal();
		stubExtent(el, 400, 400);
		const close = root(el).querySelector(".xtyle-sheet__close")!;
		close.dispatchEvent(pointer("pointerdown", { clientX: 380, clientY: 20 }));
		expect(dialogOf(el).hasAttribute("data-dragging")).toBe(false);
	});

	it("drags from the header when the grabber is suppressed", () => {
		const el = make({ heading: "Filters", "no-grabber": "" });
		el.showModal();
		stubExtent(el, 400, 400);
		swipe(el, { x: 100, y: 100 }, { x: 100, y: 260 });
		expect(el.open).toBe(false);
	});

	it("drops the gesture entirely under no-swipe, leaving the keyboard paths intact", () => {
		const el = make({ heading: "Confirm", "no-swipe": "" });
		el.showModal();
		stubExtent(el, 400, 400);
		swipe(el, { x: 200, y: 100 }, { x: 200, y: 380 });
		expect(el.open).toBe(true);
		root(el).querySelector<HTMLButtonElement>(".xtyle-sheet__close")!.click();
		expect(el.open).toBe(false);
	});
});

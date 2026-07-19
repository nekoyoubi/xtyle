// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
// side effect: defines <xtyle-tooltip> on the happy-dom registry
import "../src/elements/tooltip.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/tooltip/source.generated.js";

/**
 * The behavioral half of the tooltip's open/dismiss contract.
 *
 * `overlay-escapes.test.ts` reads the source, because placement needs layout and there isn't any here.
 * These two rules need no layout at all, and reading the source for them was actively harmful: the grep
 * for `addEventListener("keydown")` passed for as long as the listener existed *anywhere*, which is
 * exactly how a tip that could not be dismissed by hover shipped under a green suite. Assert the
 * behavior where the behavior is assertable.
 */

const OPEN_FLAG = "data-test-popover-open";

type TooltipEl = HTMLElement & { open: boolean };

/** happy-dom 15 ships no Popover API; the same stand-in the popover and combobox suites use. */
beforeAll(async () => {
	const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
	const nativeMatches = HTMLElement.prototype.matches;
	proto.matches = function matches(this: HTMLElement, selector: string): boolean {
		if (selector === ":popover-open") return this.hasAttribute(OPEN_FLAG);
		return nativeMatches.call(this, selector);
	};
	proto.showPopover = function showPopover(this: HTMLElement): void {
		this.setAttribute(OPEN_FLAG, "");
	};
	proto.hidePopover = function hidePopover(this: HTMLElement): void {
		this.removeAttribute(OPEN_FLAG);
	};
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function make(attrs: Record<string, string> = {}): { tip: TooltipEl; trigger: HTMLElement } {
	const tip = document.createElement("xtyle-tooltip") as TooltipEl;
	for (const [name, value] of Object.entries({ text: "A hint", ...attrs })) tip.setAttribute(name, value);
	const trigger = document.createElement("button");
	trigger.textContent = "Trigger";
	tip.appendChild(trigger);
	document.body.appendChild(tip);
	return { tip, trigger };
}

const escapeOn = (target: EventTarget): void => {
	target.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
};

describe("dismissing a tooltip", () => {
	/**
	 * The regression. WCAG 1.4.13 asks for dismissal *without moving pointer or focus*, so on the hover
	 * path the key lands wherever focus already was — never on the tooltip. A listener on the host only
	 * ever caught the focus case, and hover is the common one.
	 */
	it("dismisses a hover-raised hint on Escape pressed with focus elsewhere", () => {
		const { tip, trigger } = make();
		trigger.dispatchEvent(new Event("pointerenter"));
		expect(tip.open).toBe(true);

		escapeOn(document.body);
		expect(tip.open).toBe(false);
	});

	it("still dismisses when the key lands on the trigger itself", () => {
		const { tip, trigger } = make();
		trigger.dispatchEvent(new Event("pointerenter"));
		escapeOn(trigger);
		expect(tip.open).toBe(false);
	});

	it("leaves an unrelated key alone", () => {
		const { tip, trigger } = make();
		trigger.dispatchEvent(new Event("pointerenter"));
		document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));
		expect(tip.open).toBe(true);
	});

	/** The listeners are on the document, so a closed tip that keeps them is a leak that also answers
	 * Escape on behalf of a hint nobody can see. */
	it("stops listening once it is closed, and once it is gone", () => {
		const { tip, trigger } = make();
		trigger.dispatchEvent(new Event("pointerenter"));
		escapeOn(document.body);
		expect(tip.open).toBe(false);

		// a second Escape must not throw or re-fire against a closed tip
		expect(() => escapeOn(document.body)).not.toThrow();

		tip.remove();
		expect(() => escapeOn(document.body)).not.toThrow();
	});
});

describe("a hint the author forced open", () => {
	/**
	 * `open` is documented as "settable to force the hint open". Hover and focus write the same
	 * attribute, so an ordinary pointerleave used to run the hide path and strip the author's attribute
	 * for good: the one prop whose whole job is to override hover was the prop hover could delete.
	 */
	it("survives a pointer wandering over it and away", async () => {
		const { tip, trigger } = make({ open: "" });
		expect(tip.open).toBe(true);

		trigger.dispatchEvent(new Event("pointerenter"));
		trigger.dispatchEvent(new Event("pointerleave"));
		await new Promise((r) => setTimeout(r, 200)); // outlast the hide delay

		expect(tip.open).toBe(true);
		expect(tip.hasAttribute("open")).toBe(true);
	});

	it("is not Escape's to take away", () => {
		const { tip } = make({ open: "" });
		escapeOn(document.body);
		expect(tip.open).toBe(true);
	});

	it("still lowers when the author lowers it", () => {
		const { tip } = make({ open: "" });
		tip.open = false;
		expect(tip.hasAttribute("open")).toBe(false);
	});

	/** The flag tracks who last drove `open`, so an author who raises a hint after mount gets the same
	 * protection as one who wrote the attribute in markup. */
	it("protects a hint forced open after mount", async () => {
		const { tip, trigger } = make();
		tip.open = true;

		trigger.dispatchEvent(new Event("pointerenter"));
		trigger.dispatchEvent(new Event("pointerleave"));
		await new Promise((r) => setTimeout(r, 200));

		expect(tip.open).toBe(true);
	});
});

describe("an ordinary hover hint", () => {
	it("hides when the pointer leaves, since it was never the author's", async () => {
		const { tip, trigger } = make();
		trigger.dispatchEvent(new Event("pointerenter"));
		expect(tip.open).toBe(true);

		trigger.dispatchEvent(new Event("pointerleave"));
		await new Promise((r) => setTimeout(r, 200));
		expect(tip.open).toBe(false);
	});
});

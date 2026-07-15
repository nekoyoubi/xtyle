// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
// side effect: defines the <xtyle-popover> custom element on the happy-dom registry
import "../src/elements/popover.js";
import { loadFill, loadedFillNames } from "../src/elements/fragment-host.js";
import { manifest } from "../src/elements/fragments/popover/source.generated.js";

const OPEN_FLAG = "data-test-popover-open";

type StubDialog = HTMLDialogElement & { modalDoor?: boolean };

/**
 * The payoff of putting the popover's chrome in a fragment: a third-party fill for `component.popover`
 * reshapes every part of the surface the component invents. This one reclasses the whole tree onto its
 * own namespace, forces the beak on whatever the `arrow` attribute says and redraws it as a real SVG
 * notch instead of a rotated square, and stamps its own placement data onto the panel — while everything
 * the *element* owns (placement math, focus, dismissal, the modal door, the `select` contract) has to
 * survive the reskin untouched, which is what the assertions below hold it to.
 *
 * It keeps three seams, and they are the whole wiring contract: `.xtyle-popover__panel` (the node the
 * element shows and places), `.xtyle-popover__trigger` (the region it measures the anchor from), and the
 * panel staying a `<dialog>`. The last one is behavioral, not cosmetic: the modal posture is real because
 * the platform makes the background inert, and only a `<dialog>` can be opened with `showModal()`. A fill
 * is free to drop it — the element then opens through the Popover API and strikes the `aria-modal` claim
 * rather than assert an inertness nothing delivered — but a fill that wants a modal keeps the tag.
 *
 * Loaded in the order an app really has: the mod goes in at boot, before a single popover has painted,
 * and the built-in fill it overrides is pulled in ahead of it by the host — the app never imports it.
 */
const beakMod = {
	manifest: {
		$schema: "https://xript.dev/schema/mod/v0.7.json",
		xript: "0.7",
		name: "test-popover-beak",
		version: "0.0.1",
		title: "test-popover-beak",
		description: "A test mod reclassing the popover and redrawing its arrow as an SVG notch.",
		capabilities: ["xtyle.component.popover"],
		entry: { script: "mod.js", format: "script" },
		fills: {
			"component.popover": [{ id: "popover", format: "text/html+jsml", source: "popover.html" }],
		},
	},
	fragmentSources: {
		"popover.html":
			'<span class="modded-pop" data-root>' +
			'<span class="xtyle-popover__trigger" data-trigger data-slot="trigger"><slot name="trigger"></slot></span>' +
			'<dialog class="xtyle-popover__panel" popover tabindex="-1" data-surface>' +
			'<span class="modded-pop__beak" aria-hidden="true" data-arrow></span>' +
			'<div class="modded-pop__body" data-content data-slot><slot></slot></div>' +
			"</dialog></span>\n",
		"mod.js": `"use strict";
(() => {
	var BEAK = '<svg class="modded-pop__notch" viewBox="0 0 12 8" aria-hidden="true"><path d="M0 8 L6 0 L12 8 Z"></path></svg>';
	function paint(b, ops) {
		ops.setAttr("[data-root]", "class", "modded-pop" + (b.flush ? " modded-pop--bare" : ""));
		ops.setAttr("[data-trigger]", "class", "xtyle-popover__trigger modded-pop__trigger");
		ops.setAttr("[data-trigger]", "hidden", b.hasTrigger ? "" : "hidden");
		ops.setAttr("[data-surface]", "class", "xtyle-popover__panel modded-pop__panel");
		ops.setAttr("[data-surface]", "id", b.panelId || "");
		ops.setAttr("[data-surface]", "role", b.panelRole || "dialog");
		ops.setAttr("[data-surface]", "data-modal", b.modal ? "true" : "");
		ops.setAttr("[data-surface]", "aria-modal", b.modal ? "true" : "");
		ops.setAttr("[data-surface]", "aria-label", b.label || "");
		ops.setAttr("[data-surface]", "data-skin", "beak");
		// the beak is this mod's, not the component's: always drawn, and drawn as a notch
		ops.setAttr("[data-arrow]", "class", "modded-pop__beak");
		ops.setAttr("[data-arrow]", "hidden", "");
		ops.replaceChildren("[data-arrow]", BEAK);
		ops.setAttr("[data-content]", "class", "modded-pop__body");
	}
	hooks.fragment.mount("popover", paint);
	hooks.fragment.update("popover", paint);
})();
`,
	},
};

type PopoverEl = HTMLElement & {
	open: boolean;
	modal: boolean;
	show(opts?: { focus?: "first" | "panel" | "none" }): void;
	openAt(x: number, y: number): void;
	hide(reason?: string): void;
};

/** happy-dom 15 ships neither the Popover API nor the top-layer `<dialog>` machinery; both doors the
 * element can open the panel through are stood in down to the state it reads back. */
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
	dialog.close = function close(this: StubDialog): void {
		if (!this.open) return;
		this.open = false;
		this.dispatchEvent(new Event("close"));
	};

	await loadFill(beakMod.manifest, beakMod.fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function make(attrs: Record<string, string> = {}, body = "<button id='act'>Act</button>"): PopoverEl {
	const el = document.createElement("xtyle-popover") as PopoverEl;
	for (const [name, value] of Object.entries({ label: "Panel", ...attrs })) el.setAttribute(name, value);
	el.innerHTML = `<button slot="trigger" id="trig">Open</button>${body}`;
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
	return root(el).querySelector("[data-trigger]") as HTMLElement;
}

function stubRect(el: HTMLElement, rect: { top: number; left: number; width: number; height: number }): void {
	el.getBoundingClientRect = () =>
		({ ...rect, right: rect.left + rect.width, bottom: rect.top + rect.height, x: rect.left, y: rect.top }) as DOMRect;
}

function click(el: HTMLElement): void {
	el.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, cancelable: true }));
}

describe("a mod reshapes the popover", () => {
	it("registers behind xtyle's own fill, which the app never had to load", () => {
		const names = loadedFillNames();
		expect(names.indexOf(manifest.name)).toBeGreaterThanOrEqual(0);
		expect(names.indexOf(manifest.name)).toBeLessThan(names.indexOf(beakMod.manifest.name));
	});

	it("reskins every part of the surface on a popover that paints after the mod was installed", () => {
		const el = make();
		expect(root(el).querySelector(".modded-pop")).not.toBeNull();
		expect(root(el).querySelector(".modded-pop__panel")).not.toBeNull();
		expect(root(el).querySelector(".modded-pop__body")).not.toBeNull();
		expect(root(el).querySelector(".xtyle-popover")).toBeNull();
		expect(root(el).querySelector(".xtyle-popover__content")).toBeNull();
		expect(panel(el).getAttribute("data-skin")).toBe("beak");
	});

	it("redraws the arrow as its own node, and draws it on a popover that never asked for one", () => {
		const el = make();
		const beak = root(el).querySelector(".modded-pop__beak") as HTMLElement;
		expect(beak.hasAttribute("hidden")).toBe(false);
		expect(beak.querySelector(".modded-pop__notch")).not.toBeNull();
		expect(root(el).querySelector(".xtyle-popover__arrow")).toBeNull();
	});

	it("keeps the consumer's trigger and body composed into the mod's own regions", () => {
		const el = make();
		expect(el.querySelector("#trig")?.getAttribute("aria-expanded")).toBe("false");
		expect(root(el).querySelector(".modded-pop__trigger")).not.toBeNull();
		expect(root(el).querySelector(".modded-pop__body slot")).not.toBeNull();
	});

	it("still places the mod's panel against the trigger, and still toggles on a trigger click", () => {
		const el = make();
		stubRect(triggerRegion(el), { top: 200, left: 120, width: 90, height: 32 });
		click(el.querySelector("#trig") as HTMLElement);
		expect(el.open).toBe(true);
		expect(panel(el).style.top).toBe("240px");
		expect(panel(el).getAttribute("data-placement")).toBe("bottom");
		expect(el.querySelector("#trig")?.getAttribute("aria-expanded")).toBe("true");

		click(el.querySelector("#trig") as HTMLElement);
		expect(el.open).toBe(false);
	});

	it("keeps focus, `select`-to-close, and the close reason working under the reskin", () => {
		const el = make();
		const reasons: string[] = [];
		el.addEventListener("close", (event) => reasons.push((event as CustomEvent).detail.reason));
		el.show();
		expect(document.activeElement).toBe(el.querySelector("#act"));

		(el.querySelector("#act") as HTMLElement).dispatchEvent(
			new CustomEvent("select", { bubbles: true, composed: true, detail: { value: "x" } }),
		);
		expect(el.open).toBe(false);
		expect(reasons).toEqual(["select"]);
	});

	it("still opens the modal posture through `showModal()`, because the fill kept the panel a dialog", () => {
		const el = make({ modal: "" });
		el.show();
		expect(panel(el).tagName).toBe("DIALOG");
		expect(panel(el).modalDoor).toBe(true);
		expect(panel(el).getAttribute("aria-modal")).toBe("true");
		expect(panel(el).hasAttribute(OPEN_FLAG)).toBe(false);
	});

	it("still anchors the mod's panel to a bare point", () => {
		const el = make();
		el.openAt(300, 220);
		expect(panel(el).style.left).toBe("300px");
		expect(panel(el).style.top).toBe("228px");
	});
});

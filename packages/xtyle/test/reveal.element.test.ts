// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/reveal.js";
import "../src/elements/reveal-group.js";
import type { XtyleReveal } from "../src/elements/reveal.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { revealHostCss } from "../src/markup/reveal.js";
import { revealCss } from "../src/css/components/reveal.js";
import { manifest, fragmentSources } from "../src/elements/fragments/reveal/source.generated.js";

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

interface BellySpec {
	behavior?: string;
	latchAt?: string;
	commitAt?: string;
}

/** The fill renders into the element's root, which is a shadow root when styleMode resolves to isolated. */
function chrome(el: XtyleReveal): ParentNode {
	return el.shadowRoot ?? el;
}

function make(attrs: Record<string, string> = {}, bellies: Record<string, BellySpec | true> = {}): XtyleReveal {
	const el = document.createElement("xtyle-reveal") as XtyleReveal;
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);

	const face = document.createElement("article");
	face.textContent = "face";
	el.append(face);

	for (const [direction, spec] of Object.entries(bellies)) {
		const belly = document.createElement("div");
		belly.setAttribute("slot", direction);
		belly.textContent = `${direction} belly`;
		if (spec !== true) {
			if (spec.behavior) el.setAttribute(`${direction}-behavior`, spec.behavior);
			if (spec.latchAt) el.setAttribute(`${direction}-latch-at`, spec.latchAt);
			if (spec.commitAt) el.setAttribute(`${direction}-commit-at`, spec.commitAt);
		}
		belly.append(document.createElement("button"));
		el.append(belly);
	}

	document.body.append(el);
	return el;
}

describe("xtyle-reveal", () => {
	it("renders its fill rather than being dropped", () => {
		const el = make({}, { end: true });
		expect(chrome(el).querySelector(".xtyle-reveal__lid")).toBeTruthy();
	});

	it("treats only the directions with a filled belly as live", () => {
		expect(make({}, { start: true, bottom: true }).liveDirections.sort()).toEqual(["bottom", "start"]);
		expect(make({}, {}).liveDirections).toEqual([]);
	});

	it("defaults a direction to latch and reads an explicit behavior for it", () => {
		const el = make({}, { start: true, end: { behavior: "commit" }, top: { behavior: "both" } });
		expect(el.behaviorFor("start")).toBe("latch");
		expect(el.behaviorFor("end")).toBe("commit");
		expect(el.behaviorFor("top")).toBe("both");
	});

	it("falls back to latch when a direction names a behavior that does not exist", () => {
		expect(make({}, { end: { behavior: "explode" } }).behaviorFor("end")).toBe("latch");
	});
});

describe("reveal thresholds", () => {
	it("uses the documented defaults with nothing configured", () => {
		const el = make({}, { end: true });
		expect(el.latchAt("end")).toBe(0.4);
		expect(el.commitAt("end")).toBe(0.85);
	});

	it("takes host-level overrides", () => {
		const el = make({ "latch-at": "0.3", "commit-at": "0.9" }, { end: true });
		expect(el.latchAt("end")).toBe(0.3);
		expect(el.commitAt("end")).toBe(0.9);
	});

	it("lets a direction override the host default", () => {
		const el = make({ "latch-at": "0.3" }, { start: true, end: { latchAt: "0.7" } });
		expect(el.latchAt("start")).toBe(0.3);
		expect(el.latchAt("end")).toBe(0.7);
	});

	it("keeps the lid on the box by default, and lets it come clear only on request", () => {
		expect(make({}, { end: true }).travelFor("end")).toBe(0.7);
		expect(make({ travel: "1" }, { end: true }).travelFor("end")).toBe(1);
		expect(make({ travel: "0.5", "end-travel": "0.25" }, { start: true, end: true }).travelFor("end")).toBe(0.25);
	});

	it("accepts a percentage as readily as a fraction", () => {
		const el = make({ "latch-at": "25%", "commit-at": "80%" }, { end: true });
		expect(el.latchAt("end")).toBe(0.25);
		expect(el.commitAt("end")).toBe(0.8);
	});

	it("ignores a nonsense threshold rather than latching at zero or never", () => {
		for (const bad of ["0", "-1", "1.4", "banana", ""]) {
			expect(make({ "latch-at": bad }, { end: true }).latchAt("end")).toBe(0.4);
		}
	});
});

describe("reveal bellies", () => {
	it("holds every concealed belly inert, so its controls stay out of reach", () => {
		const el = make({}, { start: true, end: true });
		const bellies = Array.from(chrome(el).querySelectorAll("[data-belly]:not([hidden])"));
		expect(bellies).toHaveLength(2);
		expect(bellies.every((b) => b.hasAttribute("inert"))).toBe(true);
	});

	it("lifts inert from the belly it opens, and only that one", () => {
		const el = make({}, { start: true, end: true });
		el.reveal("start");
		expect(chrome(el).querySelector('[data-belly="start"]')!.hasAttribute("inert")).toBe(false);
		expect(chrome(el).querySelector('[data-belly="end"]')!.hasAttribute("inert")).toBe(true);
	});

	it("puts inert back when it closes", () => {
		const el = make({}, { start: true });
		el.reveal("start");
		el.conceal();
		expect(chrome(el).querySelector('[data-belly="start"]')!.hasAttribute("inert")).toBe(true);
	});

	it("refuses to open a direction with no belly under it", () => {
		const el = make({}, { start: true });
		el.reveal("end");
		expect(el.open).toBeNull();
	});

	it("refuses to open at all while disabled", () => {
		const el = make({ disabled: "" }, { start: true });
		el.reveal("start");
		expect(el.open).toBeNull();
	});
});

describe("reveal across bindings", () => {
	it("keys its bellies off the fill's wrappers, not the author's slot attribute", () => {
		const el = make({}, { start: true, end: true });
		for (const authored of Array.from(el.querySelectorAll("[slot]"))) authored.removeAttribute("slot");

		expect(el.liveDirections.sort()).toEqual(["end", "start"]);
		el.reveal("end");
		expect(el.open).toBe("end");
		expect(chrome(el).querySelector('[data-belly="end"]')!.hasAttribute("inert")).toBe(false);
	});

	it("reads every knob off the host, where all three bindings can set it", () => {
		const el = make({ "end-behavior": "both", "end-latch-at": "30%", "end-commit-at": "0.9" }, { end: true });
		for (const authored of Array.from(el.querySelectorAll("[slot]"))) authored.removeAttribute("slot");

		expect(el.behaviorFor("end")).toBe("both");
		expect(el.latchAt("end")).toBe(0.3);
		expect(el.commitAt("end")).toBe(0.9);
	});
});

describe("reveal expression", () => {
	it("defaults every grip to a glyph pointing the way that edge opens", () => {
		const el = make({}, { start: true, end: true, top: true, bottom: true });
		expect(el.gripFor("start")).toBe("chevron-right");
		expect(el.gripFor("end")).toBe("chevron-left");
		expect(el.gripFor("top")).toBe("chevron-down");
		expect(el.gripFor("bottom")).toBe("chevron-up");
	});

	it("takes a per-direction grip glyph", () => {
		const el = make({ "end-grip": "trash" }, { start: true, end: true });
		expect(el.gripFor("end")).toBe("trash");
		expect(el.gripFor("start")).toBe("chevron-right");
	});

	it("carries no tone until asked, then resolves one per direction", () => {
		expect(make({}, { end: true }).toneFor("end")).toBeNull();
		const el = make({ "start-tone": "success", "end-tone": "danger" }, { start: true, end: true });
		expect(el.toneFor("start")).toBe("success");
		expect(el.toneFor("end")).toBe("danger");
	});

	it("lets a host tone cover every direction, with one direction overriding it", () => {
		const el = make({ tone: "info", "end-tone": "danger" }, { start: true, end: true });
		expect(el.toneFor("start")).toBe("info");
		expect(el.toneFor("end")).toBe("danger");
	});

	it("ignores a tone that is not in the roster rather than painting a class nothing matches", () => {
		expect(make({ "end-tone": "chartreuse" }, { end: true }).toneFor("end")).toBeNull();
	});

	it("cuts nothing when no silhouette is asked for", async () => {
		const { resolveRevealShape } = await import("../src/reveal-shapes.js");
		expect(resolveRevealShape(null)).toBeNull();
		expect(resolveRevealShape("")).toBeNull();
		expect(resolveRevealShape("rect")).toBeNull();
	});

	it("resolves a registered name to its silhouette and its grip inset", async () => {
		const { resolveRevealShape } = await import("../src/reveal-shapes.js");
		expect(resolveRevealShape("heart")?.clip).toContain("polygon(");
		expect(resolveRevealShape("heart")?.gripInset).toBe("17%");
	});

	it("builds a box from a clip-path the registry has never heard of", async () => {
		const { resolveRevealShape } = await import("../src/reveal-shapes.js");
		expect(resolveRevealShape("circle(50% at 50% 50%)")).toEqual({ clip: "circle(50% at 50% 50%)" });
		expect(resolveRevealShape("polygon(0 0, 100% 50%, 0 100%)")?.clip).toBe("polygon(0 0, 100% 50%, 0 100%)");
	});

	it("cuts nothing for a bare word naming no silhouette, rather than emitting a clip that matches nothing", async () => {
		const { resolveRevealShape } = await import("../src/reveal-shapes.js");
		expect(resolveRevealShape("trapezoid-that-nobody-registered")).toBeNull();
	});

	it("takes a contributed silhouette by name, last-wins", async () => {
		const { resolveRevealShape, registerRevealShapes, revealShapeNames } = await import("../src/reveal-shapes.js");
		registerRevealShapes({ trapezoid: { clip: "polygon(10% 0, 90% 0, 100% 100%, 0 100%)", gripInset: "9%" } });
		expect(resolveRevealShape("trapezoid")?.gripInset).toBe("9%");
		expect(revealShapeNames()).toContain("trapezoid");

		registerRevealShapes({ trapezoid: { clip: "polygon(0 0, 100% 0, 80% 100%, 20% 100%)" } });
		expect(resolveRevealShape("trapezoid")?.clip).toBe("polygon(0 0, 100% 0, 80% 100%, 20% 100%)");
	});
});

describe("reveal grouping", () => {
	function group(name: string | null, count: number): XtyleReveal[] {
		const wrap = document.createElement("xtyle-reveal-group");
		document.body.append(wrap);
		return Array.from({ length: count }, () => {
			const el = make(name === null ? {} : { name }, { start: true });
			wrap.append(el);
			return el;
		});
	}

	it("leaves ungrouped reveals independent, so several stay open at once", () => {
		const [a, b] = group(null, 2);
		a.reveal("start");
		b.reveal("start");
		expect([a.open, b.open]).toEqual(["start", "start"]);
	});

	it("closes the last one when a shared name opens the next", () => {
		const [a, b] = group("products", 2);
		a.reveal("start");
		b.reveal("start");
		expect([a.open, b.open]).toEqual([null, "start"]);
	});

	it("keeps different names out of each other's way inside one group", () => {
		const wrap = document.createElement("xtyle-reveal-group");
		document.body.append(wrap);
		const a = make({ name: "one" }, { start: true });
		const b = make({ name: "two" }, { start: true });
		wrap.append(a, b);
		a.reveal("start");
		b.reveal("start");
		expect([a.open, b.open]).toEqual(["start", "start"]);
	});

	it("scopes a name to its own group, so two lists reusing it never cross-talk", () => {
		const [a] = group("items", 1);
		const [b] = group("items", 1);
		a.reveal("start");
		b.reveal("start");
		expect([a.open, b.open]).toEqual(["start", "start"]);
	});

	it("falls back to the document when there is no group to scope to", () => {
		const a = make({ name: "loose" }, { start: true });
		const b = make({ name: "loose" }, { start: true });
		a.reveal("start");
		b.reveal("start");
		expect([a.open, b.open]).toEqual([null, "start"]);
	});

	it("moves focus to the closing reveal's own face rather than dropping it", () => {
		const [a, b] = group("products", 2);
		a.reveal("start");
		const inside = a.querySelector<HTMLElement>('[slot="start"] button')!;
		inside.focus();
		expect(a.contains(document.activeElement)).toBe(true);

		b.reveal("start");

		expect(a.open).toBeNull();
		expect(document.activeElement).not.toBe(document.body);
		expect(a.contains(document.activeElement)).toBe(true);
	});
});

describe("reveal events", () => {
	it("announces the direction it opened", () => {
		const el = make({}, { end: true });
		let seen: string | undefined;
		el.addEventListener("xtyle:reveal", (e) => {
			seen = (e as CustomEvent).detail.direction;
		});
		el.reveal("end");
		expect(seen).toBe("end");
	});

	it("announces which direction it closed from", () => {
		const el = make({}, { end: true });
		let seen: string | undefined;
		el.addEventListener("xtyle:conceal", (e) => {
			seen = (e as CustomEvent).detail.direction;
		});
		el.reveal("end");
		el.conceal();
		expect(seen).toBe("end");
	});

	it("stays quiet when concealing something already closed", () => {
		const el = make({}, { end: true });
		let fired = 0;
		el.addEventListener("xtyle:conceal", () => (fired += 1));
		el.conceal();
		expect(fired).toBe(0);
	});
});

describe("xtyle-reveal-group", () => {
	it("is announced as a group and carries its label", () => {
		const wrap = document.createElement("xtyle-reveal-group");
		wrap.setAttribute("label", "Products");
		document.body.append(wrap);
		expect(wrap.getAttribute("role")).toBe("group");
		expect(wrap.getAttribute("aria-label")).toBe("Products");
	});

	it("keeps its children visible rather than swallowing them into a shadow root", () => {
		const wrap = document.createElement("xtyle-reveal-group");
		document.body.append(wrap);
		const child = make({}, { start: true });
		wrap.append(child);

		expect(wrap.shadowRoot).toBeNull();
		expect(wrap.contains(child)).toBe(true);
		expect(chrome(child).querySelector(".xtyle-reveal__lid")).toBeTruthy();
	});

	it("closes everything it owns on request", () => {
		const wrap = document.createElement("xtyle-reveal-group");
		document.body.append(wrap);
		const a = make({}, { start: true });
		const b = make({}, { start: true });
		wrap.append(a, b);
		a.reveal("start");
		b.reveal("start");

		(wrap as unknown as { concealAll(): void }).concealAll();

		expect([a.open, b.open]).toEqual([null, null]);
	});
});

describe("xtyle-reveal keyboard", () => {
	const press = (el: XtyleReveal, key: string): void => {
		const lid = chrome(el).querySelector(".xtyle-reveal__lid");
		lid?.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, composed: true, cancelable: true }));
	};

	it("opens the belly on the matching edge, which is the claim its a11y notes make", async () => {
		const el = make({}, { end: true, top: true });
		press(el, "ArrowLeft");
		await Promise.resolve();
		expect(el.open, "ArrowLeft moves the lid toward start, exposing the end belly").toBe("end");
	});

	it("closes whichever belly is open on Escape", async () => {
		const el = make({}, { end: true });
		el.reveal("end");
		await Promise.resolve();
		expect(el.open).toBe("end");
		press(el, "Escape");
		await Promise.resolve();
		expect(el.open).toBe(null);
	});

	it("ignores an arrow for a direction with no belly", async () => {
		const el = make({}, { end: true });
		press(el, "ArrowDown");
		await Promise.resolve();
		expect(el.open).toBe(null);
	});
});

describe("reveal clipping", () => {
	it("leaves the clip decision to the one rule that knows all three of its states", () => {
		expect(revealHostCss, "a clip on :host sits above .xtyle-reveal and wins over it").not.toContain("overflow");
		expect(revealCss).toContain(".xtyle-reveal--shaped {\n\toverflow: visible;");
		expect(revealCss).toContain(".xtyle-reveal--shaped.xtyle-reveal--contained { overflow: clip; }");
	});

	it("lays the host out as a block in the light-DOM path too, not just the shadow one", () => {
		expect(revealHostCss).toContain(":host { display: block; position: relative; }");
		expect(revealCss).toContain("xtyle-reveal { display: block; position: relative; }");
	});
});

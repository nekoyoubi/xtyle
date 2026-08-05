// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { applyEffect, applyEffects, armInView, fireEffect } from "../src/fx.js";
import { registerCondition, registerEffect } from "../src/effects.js";

afterEach(() => {
	document.body.innerHTML = "";
	vi.restoreAllMocks();
});

function el(html = "<div></div>"): HTMLElement {
	document.body.innerHTML = html;
	return document.body.firstElementChild as HTMLElement;
}

describe("the effect runtime", () => {
	it("writes the spec and the properties its parameters resolve to, which the attribute alone cannot", () => {
		const target = el();
		target.dataset.fx = "throb?rate:1.4s";
		expect(target.style.getPropertyValue("--fx-throb-duration"), "the attribute alone delivers nothing").toBe("");

		applyEffect(target, "throb?rate:1.4s");
		expect(target.getAttribute("data-fx")).toBe("throb?rate:1.4s");
		expect(target.style.getPropertyValue("--fx-throb-duration")).toBe("1.4s");
	});

	it("resolves a bare number through the parameter's own unit", () => {
		const target = el();
		applyEffect(target, "glow@hover?spread:20,color:danger");
		expect(target.style.getPropertyValue("--fx-glow-spread")).toBe("20px");
		expect(target.style.getPropertyValue("--fx-glow-color")).toBe("var(--danger)");
	});

	it("clears only what it wrote, so a swap drops no stale parameter and steals no deliberate override", () => {
		const target = el();
		target.style.setProperty("--fx-color", "var(--pink)");
		applyEffect(target, "glow?spread:20,color:danger");
		applyEffect(target, "glow?spread:4");

		expect(target.style.getPropertyValue("--fx-glow-spread")).toBe("4px");
		expect(target.style.getPropertyValue("--fx-glow-color"), "the stale parameter must not retune the new spec").toBe("");
		expect(target.style.getPropertyValue("--fx-color"), "the page's own override is not ours to clear").toBe("var(--pink)");
	});

	it("takes the effect off entirely on null", () => {
		const target = el();
		applyEffect(target, "glow?spread:20");
		applyEffect(target, null);
		expect(target.hasAttribute("data-fx")).toBe(false);
		expect(target.style.getPropertyValue("--fx-glow-spread")).toBe("");
	});

	it("walks a subtree, and counts the root itself when it carries one", () => {
		const root = el(`<section data-fx="lift@hover?distance:9"><b data-fx="throb?rate:2s"></b><i></i></section>`);
		expect(applyEffects(root)).toBe(2);
		expect(root.style.getPropertyValue("--fx-lift-distance")).toBe("9px");
		expect(root.querySelector("b")?.style.getPropertyValue("--fx-throb-duration")).toBe("2s");
	});

	it("names what a spec asked for and did not get, rather than leaving it silently inert", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		applyEffect(el(), "glow@dragging");
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('condition "dragging"'));

		applyEffect(el(), "sparkle@hover");
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('effect "sparkle"'));

		applyEffect(el(), "glow?nope:3");
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('parameter "nope"'));
	});

	it("says nothing about a spec every registry knows", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		applyEffect(el(), "glow@hover?spread:18");
		expect(warn).not.toHaveBeenCalled();
	});
});

describe("firing a transient", () => {
	it("sets the fired condition and clears it once the animation has landed", async () => {
		const target = el();
		const pending = fireEffect(target, "pop@fired?scale:0.3");
		expect(target.hasAttribute("data-fx-fired"), "the condition has to be live while it plays").toBe(true);
		expect(target.style.getPropertyValue("--fx-pop-scale")).toBe("0.3");
		await pending;
		expect(target.hasAttribute("data-fx-fired"), "and gone after, or the next call cannot re-fire it").toBe(false);
	});

	it("fires whatever the element already carries when given no spec", async () => {
		const target = el(`<div data-fx="flash@fired"></div>`);
		const pending = fireEffect(target);
		expect(target.hasAttribute("data-fx-fired")).toBe(true);
		await pending;
		expect(target.getAttribute("data-fx")).toBe("flash@fired");
	});

	it("restarts a call that arrives mid-flight instead of swallowing it", async () => {
		const target = el();
		const first = fireEffect(target, "wobble@fired");
		const second = fireEffect(target, "wobble@fired");
		expect(target.hasAttribute("data-fx-fired")).toBe(true);
		await Promise.all([first, second]);
		expect(target.hasAttribute("data-fx-fired")).toBe(false);
	});
});

describe("arming reveal", () => {
	it("arms every reveal under a root and disarms it on arrival", () => {
		const observed: Element[] = [];
		let fire: ((entries: { target: Element; isIntersecting: boolean }[]) => void) | null = null;
		vi.stubGlobal(
			"IntersectionObserver",
			class {
				constructor(callback: (entries: { target: Element; isIntersecting: boolean }[]) => void) {
					fire = callback;
				}
				observe(node: Element): void {
					observed.push(node);
				}
				unobserve(): void {}
				disconnect(): void {}
			},
		);

		const root = el(`<div><p data-fx="reveal?distance:12"></p><p data-fx="glow@hover"></p></div>`);
		const stop = armInView(root);
		const [first, second] = [...root.querySelectorAll("p")];

		expect(observed, "only a reveal needs an observer").toEqual([first]);
		expect(first?.hasAttribute("data-fx-armed")).toBe(true);
		expect(second?.hasAttribute("data-fx-armed")).toBe(false);

		fire!([{ target: first as Element, isIntersecting: true }]);
		expect(first?.hasAttribute("data-fx-armed")).toBe(false);
		stop();
		vi.unstubAllGlobals();
	});

	it("arms nothing at all where there is no observer, so a reader never loses the content", () => {
		vi.stubGlobal("IntersectionObserver", undefined);
		const root = el(`<div><p data-fx="reveal"></p></div>`);
		armInView(root);
		expect(root.querySelector("p")?.hasAttribute("data-fx-armed")).toBe(false);
		vi.unstubAllGlobals();
	});
});

describe("the runtime follows the registries rather than the names it shipped with", () => {
	afterEach(() => {
		registerCondition({ name: "fired", selector: "[data-fx-fired]", attribute: "data-fx-fired" });
		registerCondition({ name: "armed", selector: "[data-fx-armed]", attribute: "data-fx-armed" });
	});

	it("fires through whatever attribute the `fired` condition declares", async () => {
		registerCondition({ name: "fired", selector: "[data-boom]", attribute: "data-boom" });
		const target = el();
		const pending = fireEffect(target, "pop@fired");
		expect(target.hasAttribute("data-boom"), "a re-pointed condition has to be the one the runtime drives").toBe(true);
		expect(target.hasAttribute("data-fx-fired")).toBe(false);
		await pending;
		expect(target.hasAttribute("data-boom")).toBe(false);
	});

	it("arms a mod's own enter effect, not only the one the library ships", () => {
		vi.stubGlobal(
			"IntersectionObserver",
			class {
				observe(): void {}
				unobserve(): void {}
				disconnect(): void {}
			},
		);
		registerEffect({ name: "curtain", ambient: false, arms: true, active: "opacity:0" });
		const root = el(`<div><p data-fx="curtain"></p><p data-fx="glow@hover"></p></div>`);
		armInView(root);
		const [first, second] = [...root.querySelectorAll("p")];
		expect(first?.hasAttribute("data-fx-armed"), "declaring `arms` is what earns the observer").toBe(true);
		expect(second?.hasAttribute("data-fx-armed")).toBe(false);
		vi.unstubAllGlobals();
	});
});

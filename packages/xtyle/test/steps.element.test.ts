// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
// side effect: defines the <xtyle-steps> custom element on the happy-dom registry
import "../src/elements/steps.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/steps/source.generated.js";

type StepsEl = HTMLElement & { current: number };

/** Warm the shared fill so every element render below applies its ops synchronously. */
beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

/** The authored list the element adopts. It is detached from the element once the fill renders, but
 * stays live and referenced — which is exactly what a framework re-rendering its own `<ol>` holds. */
let authored: HTMLElement;

function make(current: number, labels: string[] = ["Cart", "Shipping", "Payment", "Review"]): StepsEl {
	const el = document.createElement("xtyle-steps") as StepsEl;
	el.setAttribute("current", String(current));
	const list = document.createElement("ol");
	for (const label of labels) {
		const li = document.createElement("li");
		li.textContent = label;
		list.appendChild(li);
	}
	el.appendChild(list);
	document.body.appendChild(el);
	authored = list;
	return el;
}

function steps(el: StepsEl): HTMLElement[] {
	return [...el.querySelectorAll<HTMLElement>(".xtyle-steps__step")];
}

function markers(el: StepsEl): string[] {
	return [...el.querySelectorAll(".xtyle-steps__marker")].map((m) => m.textContent ?? "");
}

function stateOf(step: HTMLElement): string {
	if (step.classList.contains("xtyle-steps__step--done")) return "done";
	if (step.classList.contains("xtyle-steps__step--current")) return "current";
	return "upcoming";
}

function labelText(el: StepsEl, index: number): string {
	return el.querySelector(`[data-slot="step-${index}"]`)?.textContent ?? "";
}

/** Let the MutationObserver's microtask deliver and the re-render run. */
function settle(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("steps: the fill owns the furniture", () => {
	it("renders the marker and the connector as real nodes, not painted glyphs", () => {
		const el = make(1);
		// the whole point of the conversion: a mod can reach these because they exist in the DOM
		expect(el.querySelectorAll(".xtyle-steps__marker")).toHaveLength(4);
		expect(el.querySelector(".xtyle-steps__list")?.tagName).toBe("OL");
		expect(steps(el)).toHaveLength(4);
	});

	it("numbers upcoming steps by ordinal and checks the done ones", () => {
		expect(markers(make(2))).toEqual(["✓", "✓", "3", "4"]);
	});

	it("gives every step but the first a connector back to the one before it", () => {
		const el = make(1);
		expect(el.querySelectorAll(".xtyle-steps__connector")).toHaveLength(3);
		expect(steps(el)[0].querySelector(".xtyle-steps__connector")).toBeNull();
		for (const step of steps(el).slice(1)) {
			expect(step.querySelector(".xtyle-steps__connector")).not.toBeNull();
		}
	});

	it("hides the decorative furniture from assistive tech", () => {
		const el = make(1);
		for (const node of el.querySelectorAll(".xtyle-steps__marker, .xtyle-steps__connector")) {
			expect(node.getAttribute("aria-hidden")).toBe("true");
		}
	});
});

describe("steps: the element still owns the state", () => {
	it("splits the steps into done / current / upcoming by index against `current`", () => {
		expect(steps(make(2)).map(stateOf)).toEqual(["done", "done", "current", "upcoming"]);
	});

	it("flags only the current step with `aria-current`", () => {
		const el = make(1);
		expect(steps(el).map((s) => s.getAttribute("aria-current"))).toEqual([null, "step", null, null]);
	});

	it("treats a first step as current and everything after as upcoming", () => {
		expect(steps(make(0)).map(stateOf)).toEqual(["current", "upcoming", "upcoming", "upcoming"]);
	});

	it("marks every step done once `current` runs past the end", () => {
		expect(steps(make(9)).map(stateOf)).toEqual(["done", "done", "done", "done"]);
		expect(markers(make(9))).toEqual(["✓", "✓", "✓", "✓"]);
	});

	it("re-splits when `current` advances", () => {
		const el = make(1);
		el.current = 3;
		expect(steps(el).map(stateOf)).toEqual(["done", "done", "done", "current"]);
		expect(markers(el)).toEqual(["✓", "✓", "✓", "4"]);
		expect(steps(el).map((s) => s.getAttribute("aria-current"))).toEqual([null, null, null, "step"]);
	});

	it("clears `aria-current` from the step it moved off", () => {
		const el = make(1);
		el.current = 2;
		expect(steps(el)[1].hasAttribute("aria-current")).toBe(false);
	});
});

describe("steps: the author's content survives", () => {
	it("relocates each step's content into the fill's label region", () => {
		const el = make(1);
		expect([0, 1, 2, 3].map((i) => labelText(el, i))).toEqual(["Cart", "Shipping", "Payment", "Review"]);
	});

	it("relocates the author's nodes rather than serializing them", () => {
		const el = document.createElement("xtyle-steps") as StepsEl;
		const list = document.createElement("ol");
		const li = document.createElement("li");
		const authored = document.createElement("strong");
		authored.textContent = "Cart";
		li.appendChild(authored);
		list.appendChild(li);
		el.appendChild(list);
		document.body.appendChild(el);

		// node identity, not innerHTML equality — a framework's live node stays mounted and reactive
		expect(el.querySelector('[data-slot="step-0"]')?.firstChild).toBe(authored);
	});

	it("keeps that same node across a `current` change", () => {
		const el = make(1);
		const before = el.querySelector('[data-slot="step-2"]')?.firstChild;
		el.current = 2;
		expect(el.querySelector('[data-slot="step-2"]')?.firstChild).toBe(before);
		expect(labelText(el, 2)).toBe("Payment");
	});

	it("carries the author's own `<li>` attributes onto the rendered step", () => {
		const el = document.createElement("xtyle-steps") as StepsEl;
		const list = document.createElement("ol");
		const li = document.createElement("li");
		li.id = "step-cart";
		li.setAttribute("data-testid", "cart");
		li.className = "mine";
		li.textContent = "Cart";
		list.appendChild(li);
		el.appendChild(list);
		document.body.appendChild(el);

		const step = el.querySelector<HTMLElement>(".xtyle-steps__step");
		expect(step?.id).toBe("step-cart");
		expect(step?.getAttribute("data-testid")).toBe("cart");
		expect(step?.classList.contains("mine")).toBe(true);
		// the fill's own state class still lands alongside the author's
		expect(step?.classList.contains("xtyle-steps__step--current")).toBe(true);
	});

	it("leaves no authored list rendered beside the fill's", () => {
		const el = make(1);
		expect(el.querySelectorAll("ol")).toHaveLength(1);
		expect(el.querySelector("ol")?.hasAttribute("data-root")).toBe(true);
	});
});

describe("steps: the observer still re-reads the list", () => {
	it("picks up a step appended to the authored list", async () => {
		const el = make(1);
		const li = document.createElement("li");
		li.textContent = "Receipt";
		authored.appendChild(li);
		await settle();

		expect(steps(el)).toHaveLength(5);
		expect(markers(el)).toEqual(["✓", "2", "3", "4", "5"]);
		expect(labelText(el, 4)).toBe("Receipt");
		// the new last step gets a connector; the first still has none
		expect(el.querySelectorAll(".xtyle-steps__connector")).toHaveLength(4);
	});

	it("picks up a removed step and keeps the survivors' content", async () => {
		const el = make(2);
		authored.lastElementChild?.remove();
		await settle();

		expect(steps(el)).toHaveLength(3);
		expect(steps(el).map(stateOf)).toEqual(["done", "done", "current"]);
		expect([0, 1, 2].map((i) => labelText(el, i))).toEqual(["Cart", "Shipping", "Payment"]);
	});

	it("adopts a list swapped in wholesale", async () => {
		const el = make(1);
		const replacement = document.createElement("ol");
		for (const label of ["A", "B"]) {
			const li = document.createElement("li");
			li.textContent = label;
			replacement.appendChild(li);
		}
		el.appendChild(replacement);
		await settle();

		expect(steps(el)).toHaveLength(2);
		expect([0, 1].map((i) => labelText(el, i))).toEqual(["A", "B"]);
		expect(el.querySelectorAll("ol")).toHaveLength(1);
	});
});

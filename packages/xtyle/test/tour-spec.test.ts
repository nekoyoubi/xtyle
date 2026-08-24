// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import "../src/elements/tour.js";
import type { XtyleTour } from "../src/elements/tour.js";
import type { TourSpec } from "../src/markup/tour.js";

afterEach(() => {
	document.body.innerHTML = "";
});

const SPEC: TourSpec = {
	id: "first-run",
	title: "Getting around",
	summary: "Three stops",
	steps: [
		{ target: "#one", heading: "The rail", body: "Everything hangs off this." },
		{ target: "#two", heading: "The canvas", placement: "left", shape: "circle" },
		{ target: "#three", body: "And that is the tour.", scrollIntoView: true, noDismiss: true },
	],
};

function tour(): XtyleTour {
	document.body.innerHTML = `<div id="one"></div><div id="two"></div><div id="three"></div><xtyle-tour></xtyle-tour>`;
	return document.querySelector("xtyle-tour") as XtyleTour;
}

/**
 * A tour authored as markup lives inside the one screen it tours, so nothing else can address it. As
 * data it can be held in a variable, named, listed, or contributed — which is the whole reason the
 * items-mode exists on `tabs` and `accordion` too.
 */
describe("a tour can be declared as data", () => {
	it("materializes a step element per spec step, so there is one step-reading path", () => {
		const el = tour();
		el.spec = SPEC;
		expect(el.steps).toHaveLength(3);
		expect(el.steps.every((s) => s.tagName === "XTYLE-TOUR-STEP")).toBe(true);
	});

	it("carries each step's framing onto the element the tour already reads", () => {
		const el = tour();
		el.spec = SPEC;
		const [first, second, third] = el.steps;
		expect(first.getAttribute("target")).toBe("#one");
		expect(first.getAttribute("heading")).toBe("The rail");
		expect(first.textContent).toBe("Everything hangs off this.");
		expect(second.getAttribute("placement")).toBe("left");
		expect(second.getAttribute("shape")).toBe("circle");
		expect(third.hasAttribute("scroll-into-view")).toBe(true);
		expect(third.hasAttribute("no-dismiss")).toBe(true);
	});

	it("omits what the spec omits rather than writing empty attributes", () => {
		const el = tour();
		el.spec = SPEC;
		expect(el.steps[2].hasAttribute("heading")).toBe(false);
		expect(el.steps[0].hasAttribute("placement")).toBe(false);
	});

	it("replaces the steps it had, so re-specifying is not appending", () => {
		const el = tour();
		el.spec = SPEC;
		el.spec = { steps: [{ target: "#one" }] };
		expect(el.steps).toHaveLength(1);
	});

	it("takes the serialized form too, because that is what a framework binding sends", () => {
		const el = tour();
		el.spec = JSON.stringify(SPEC) as unknown as TourSpec;
		expect(el.steps).toHaveLength(3);
		expect(el.steps[0]?.getAttribute("target")).toBe("#one");
	});

	it("takes it from the attribute", () => {
		const el = tour();
		el.setAttribute("spec", JSON.stringify(SPEC));
		expect(el.steps).toHaveLength(3);
	});

	it("renders the same steps whichever of the three paths wrote it", () => {
		const byObject = tour();
		byObject.spec = SPEC;
		const byString = tour();
		byString.spec = JSON.stringify(SPEC) as unknown as TourSpec;
		const byAttribute = tour();
		byAttribute.setAttribute("spec", JSON.stringify(SPEC));
		expect([byObject.steps.length, byString.steps.length, byAttribute.steps.length]).toEqual([3, 3, 3]);
	});

	it("takes a shape it cannot use as no steps rather than throwing", () => {
		const el = tour();
		expect(() => {
			el.spec = "not json" as unknown as TourSpec;
		}).not.toThrow();
		expect(() => {
			el.spec = { title: "no steps" } as unknown as TourSpec;
		}).not.toThrow();
		expect(el.steps).toHaveLength(0);
	});

	it("drives the same sequence a slotted tour does", () => {
		const el = tour();
		el.spec = SPEC;
		el.start();
		expect(el.currentIndex).toBe(0);
		el.next();
		expect(el.currentIndex).toBe(1);
		el.back();
		expect(el.currentIndex).toBe(0);
	});

	it("reports completed and dismissed apart, which is what an app stores", () => {
		const el = tour();
		el.spec = SPEC;
		const seen: string[] = [];
		el.addEventListener("complete", () => seen.push("complete"));
		el.addEventListener("skip", () => seen.push("skip"));
		el.start();
		el.finish();
		el.start();
		el.skip();
		expect(seen).toEqual(["complete", "skip"]);
	});

	/** The component keeps no memory of having been taken, on purpose: which storage, whose, and whether
	 * it survives a content change are all the app's calls. `taken` is the app telling the component. */
	it("takes `taken` as state it is told, not state it keeps", () => {
		const el = tour();
		expect(el.taken).toBe(false);
		el.taken = true;
		expect(el.hasAttribute("taken")).toBe(true);
		el.taken = false;
		expect(el.hasAttribute("taken")).toBe(false);
	});
});

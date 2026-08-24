// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import "../src/elements/tour.js";
import "../src/elements/spotlight.js";
import type { XtyleTour } from "../src/elements/tour.js";
import type { TourSpec } from "../src/markup/tour.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/tour/source.generated.js";
import {
	manifest as spotManifest,
	fragmentSources as spotSources,
} from "../src/elements/fragments/spotlight/source.generated.js";

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
	await loadFill(spotManifest, spotSources);
});

afterEach(() => {
	document.body.innerHTML = "";
	vi.restoreAllMocks();
});

const frame = (): Promise<void> => new Promise((resolve) => requestAnimationFrame(() => resolve()));
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

function mount(spec: TourSpec, present: string[] = []): XtyleTour {
	document.body.innerHTML = `${present.map((id) => `<div id="${id.slice(1)}"></div>`).join("")}<xtyle-tour></xtyle-tour>`;
	const el = document.querySelector("xtyle-tour") as XtyleTour;
	el.spec = spec;
	return el;
}

function spotlight(el: XtyleTour): HTMLElement | null {
	const root: ParentNode = el.shadowRoot ?? el;
	return root.querySelector("[data-tour-spotlight]");
}

const TWO_STEPS: TourSpec = {
	id: "panels",
	title: "Panels",
	steps: [
		{ target: "#early", heading: "Here first" },
		{ target: "#late", heading: "Made on demand" },
	],
};

describe("a tour prepares a step before anything measures for it", () => {
	it("awaits `beforeStep` before resolving the target, so a step can make its own", async () => {
		const el = mount(TWO_STEPS, ["#early"]);
		const order: string[] = [];
		el.beforeStep = async (index) => {
			order.push(`before:${index}`);
			if (index === 1) {
				const made = document.createElement("div");
				made.id = "late";
				document.body.appendChild(made);
			}
		};
		el.start();
		await settle();
		el.next();
		await settle();
		order.push("measured");
		expect(order).toEqual(["before:0", "before:1", "measured"]);
		expect(spotlight(el)?.getAttribute("open")).toBe("");
	});

	it("opens the step anyway when `beforeStep` throws, rather than stranding the tour", async () => {
		const el = mount(TWO_STEPS, ["#early"]);
		const logged = vi.spyOn(console, "error").mockImplementation(() => {});
		el.beforeStep = async () => {
			throw new Error("panel refused to open");
		};
		el.start();
		await settle();
		expect(spotlight(el)?.getAttribute("open")).toBe("");
		expect(logged).toHaveBeenCalled();
	});

	it("does not reopen a tour the user closed while `beforeStep` was still running", async () => {
		const el = mount(TWO_STEPS, ["#early"]);
		let release = (): void => {};
		el.beforeStep = () => new Promise<void>((resolve) => (release = resolve));
		el.start();
		el.skip();
		expect(el.hasAttribute("open")).toBe(false);
		release();
		await settle();
		expect(el.hasAttribute("open")).toBe(false);
		expect(spotlight(el)?.hasAttribute("open")).toBe(false);
	});

	it("prepares each step once, not once per repaint", async () => {
		const el = mount(TWO_STEPS, ["#early", "#late"]);
		const calls: number[] = [];
		el.beforeStep = (index) => {
			calls.push(index);
		};
		el.start();
		await settle();
		expect(calls).toEqual([0]);
		el.next();
		await settle();
		expect(calls).toEqual([0, 1]);
	});

	it("re-aims when a running tour is given a different spec at the same index", async () => {
		const el = mount(TWO_STEPS, ["#early", "#late", "#other"]);
		el.start();
		await settle();
		el.spec = { id: "swapped", title: "Swapped", steps: [{ target: "#other", heading: "Elsewhere" }] };
		await settle();
		const spot = spotlight(el) as unknown as { targetElement: Element | null } | null;
		expect(spot?.targetElement).toBe(document.querySelector("#other"));
	});

	it("does not hunt for a target after the tour is gone", async () => {
		const el = mount({ id: "x", title: "x", steps: [{ target: "#never", heading: "Nope" }] });
		const missing = vi.fn();
		el.addEventListener("target-missing", missing);
		el.targetTimeout = 60;
		let release = (): void => {};
		el.beforeStep = () => new Promise<void>((resolve) => (release = resolve));
		el.start();
		el.close();
		release();
		await settle();
		await frame();
		await frame();
		await new Promise((resolve) => setTimeout(resolve, 90));
		expect(missing).not.toHaveBeenCalled();
	});
});

describe("a tour keeps looking for a target that is not there yet", () => {
	it("opens immediately rather than waiting for the target to appear", async () => {
		const el = mount({ id: "x", title: "x", steps: [{ target: "#later", heading: "Soon" }] });
		el.start();
		expect(spotlight(el)?.getAttribute("open")).toBe("");
	});

	it("attaches a target that lands after the callout is already up", async () => {
		const el = mount({ id: "x", title: "x", steps: [{ target: "#later", heading: "Soon" }] });
		el.targetTimeout = 2000;
		el.start();
		await frame();
		const late = document.createElement("div");
		late.id = "later";
		document.body.appendChild(late);
		await frame();
		await frame();
		expect((spotlight(el) as unknown as { targetElement: Element | null })?.targetElement).toBe(late);
	});

	it("reports a target that never arrives, so a typo reads apart from a slow app", async () => {
		const el = mount({ id: "x", title: "x", steps: [{ target: "#absent", heading: "Gone" }] });
		const missing = vi.fn();
		el.addEventListener("target-missing", missing);
		el.targetTimeout = 40;
		el.start();
		await new Promise((resolve) => setTimeout(resolve, 120));
		expect(missing).toHaveBeenCalledTimes(1);
		expect((missing.mock.calls[0]?.[0] as CustomEvent).detail).toMatchObject({ index: 0, target: "#absent" });
	});

	it("stays quiet when the target merely arrived late", async () => {
		const el = mount({ id: "x", title: "x", steps: [{ target: "#slow", heading: "Slow" }] });
		const missing = vi.fn();
		el.addEventListener("target-missing", missing);
		el.targetTimeout = 500;
		el.start();
		await frame();
		const late = document.createElement("div");
		late.id = "slow";
		document.body.appendChild(late);
		await new Promise((resolve) => setTimeout(resolve, 120));
		expect(missing).not.toHaveBeenCalled();
	});
});

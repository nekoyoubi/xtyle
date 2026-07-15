// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
// side effect: defines the <xtyle-timeline> custom element on the happy-dom registry
import "../src/elements/timeline.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/timeline/source.generated.js";

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

function make(titles: string[] = ["Deployed", "Merged", "Opened"]): HTMLElement {
	const el = document.createElement("xtyle-timeline");
	const list = document.createElement("ol");
	for (const title of titles) {
		const li = document.createElement("li");
		const strong = document.createElement("strong");
		strong.textContent = title;
		li.appendChild(strong);
		list.appendChild(li);
	}
	el.appendChild(list);
	document.body.appendChild(el);
	authored = list;
	return el;
}

function items(el: HTMLElement): HTMLElement[] {
	return [...el.querySelectorAll<HTMLElement>(".xtyle-timeline__item")];
}

function contentText(el: HTMLElement, index: number): string {
	return el.querySelector(`[data-slot="event-${index}"]`)?.textContent ?? "";
}

/** Let the MutationObserver's microtask deliver and the re-render run. */
function settle(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("timeline: the fill owns the furniture", () => {
	it("renders the dot and the rail as real nodes, not painted lines", () => {
		const el = make();
		// the whole point of the conversion: a mod can reach these because they exist in the DOM
		expect(el.querySelectorAll(".xtyle-timeline__dot")).toHaveLength(3);
		expect(el.querySelector(".xtyle-timeline__list")?.tagName).toBe("OL");
		expect(items(el)).toHaveLength(3);
	});

	it("stops the rail at the last event instead of trailing a line into nothing", () => {
		const el = make();
		expect(el.querySelectorAll(".xtyle-timeline__rail")).toHaveLength(2);
		expect(items(el)[2].querySelector(".xtyle-timeline__rail")).toBeNull();
		for (const item of items(el).slice(0, 2)) {
			expect(item.querySelector(".xtyle-timeline__rail")).not.toBeNull();
		}
	});

	it("draws no rail at all for a single-event feed", () => {
		const el = make(["Only"]);
		expect(el.querySelectorAll(".xtyle-timeline__dot")).toHaveLength(1);
		expect(el.querySelectorAll(".xtyle-timeline__rail")).toHaveLength(0);
	});

	it("hides the decorative furniture from assistive tech", () => {
		const el = make();
		for (const node of el.querySelectorAll(".xtyle-timeline__dot, .xtyle-timeline__rail")) {
			expect(node.getAttribute("aria-hidden")).toBe("true");
		}
	});
});

describe("timeline: the author's content survives", () => {
	it("relocates each event's content into the fill's content region", () => {
		const el = make();
		expect([0, 1, 2].map((i) => contentText(el, i))).toEqual(["Deployed", "Merged", "Opened"]);
	});

	it("relocates the author's nodes rather than serializing them", () => {
		const el = document.createElement("xtyle-timeline");
		const list = document.createElement("ol");
		const li = document.createElement("li");
		const title = document.createElement("strong");
		title.textContent = "Deployed";
		const when = document.createElement("time");
		when.setAttribute("datetime", "2026-07-13T12:04");
		when.textContent = "12:04";
		li.append(title, when);
		list.appendChild(li);
		el.appendChild(list);
		document.body.appendChild(el);

		const region = el.querySelector('[data-slot="event-0"]');
		// node identity, not innerHTML equality — a framework's live node stays mounted and reactive
		expect(region?.firstChild).toBe(title);
		expect(region?.lastChild).toBe(when);
		// the title/meta/body styling hooks still anchor on a direct child of the content region
		expect(el.querySelector(".xtyle-timeline__content > strong")).toBe(title);
		expect(el.querySelector(".xtyle-timeline__content > time")).toBe(when);
	});

	it("carries the author's own `<li>` attributes onto the rendered event", () => {
		const el = document.createElement("xtyle-timeline");
		const list = document.createElement("ol");
		const li = document.createElement("li");
		li.id = "event-deploy";
		li.setAttribute("data-testid", "deploy");
		li.className = "mine";
		li.textContent = "Deployed";
		list.appendChild(li);
		el.appendChild(list);
		document.body.appendChild(el);

		const item = el.querySelector<HTMLElement>(".xtyle-timeline__item");
		expect(item?.id).toBe("event-deploy");
		expect(item?.getAttribute("data-testid")).toBe("deploy");
		expect(item?.classList.contains("mine")).toBe(true);
		expect(item?.classList.contains("xtyle-timeline__item")).toBe(true);
	});

	it("leaves no authored list rendered beside the fill's", () => {
		const el = make();
		expect(el.querySelectorAll("ol")).toHaveLength(1);
		expect(el.querySelector("ol")?.hasAttribute("data-root")).toBe(true);
	});

	it("renders a semantic ordered list of items, so the feed still reads in order", () => {
		const el = make();
		const list = el.querySelector("ol");
		expect([...(list?.children ?? [])].map((c) => c.tagName)).toEqual(["LI", "LI", "LI"]);
	});
});

describe("timeline: the observer still re-reads the list", () => {
	it("picks up an event appended to the authored list and moves the rail's end", async () => {
		const el = make();
		const li = document.createElement("li");
		li.textContent = "Reverted";
		authored.appendChild(li);
		await settle();

		expect(items(el)).toHaveLength(4);
		expect(contentText(el, 3)).toBe("Reverted");
		// the rail now runs to the new last event, which itself has none
		expect(el.querySelectorAll(".xtyle-timeline__rail")).toHaveLength(3);
		expect(items(el)[3].querySelector(".xtyle-timeline__rail")).toBeNull();
		expect(items(el)[2].querySelector(".xtyle-timeline__rail")).not.toBeNull();
	});

	it("picks up a removed event and keeps the survivors' content", async () => {
		const el = make();
		authored.lastElementChild?.remove();
		await settle();

		expect(items(el)).toHaveLength(2);
		expect([0, 1].map((i) => contentText(el, i))).toEqual(["Deployed", "Merged"]);
		expect(el.querySelectorAll(".xtyle-timeline__rail")).toHaveLength(1);
	});

	it("adopts a list swapped in wholesale", async () => {
		const el = make();
		const replacement = document.createElement("ol");
		for (const title of ["A", "B"]) {
			const li = document.createElement("li");
			li.textContent = title;
			replacement.appendChild(li);
		}
		el.appendChild(replacement);
		await settle();

		expect(items(el)).toHaveLength(2);
		expect([0, 1].map((i) => contentText(el, i))).toEqual(["A", "B"]);
		expect(el.querySelectorAll("ol")).toHaveLength(1);
	});
});

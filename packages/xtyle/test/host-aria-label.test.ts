// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/index.js";
import { loadAllFills } from "./all-fills.js";

beforeAll(() => loadAllFills());

afterEach(() => {
	document.body.innerHTML = "";
});

const ROLE_ELEMENT: Record<string, string> = {
	field: "input",
	switch: '[role="switch"]',
	checkbox: 'input[type="checkbox"]',
	radio: 'input[type="radio"]',
	"checkbox-group": '[role="group"]',
	"radio-group": '[role="radiogroup"]',
	slider: '[role="slider"]',
	"number-input": '[role="spinbutton"]',
	"color-picker": '[role="group"]',
	dialog: "dialog",
	sheet: "dialog",
	popover: "dialog",
	"command-palette": "dialog",
	menu: '[role="menu"]',
	tabs: '[role="tablist"]',
	"bottom-nav": '[role="tablist"]',
	tree: '[role="tree"]',
	toc: "nav",
	breadcrumb: "nav",
	pagination: "nav",
	"avatar-group": '[role="group"]',
	reveal: '[role="group"]',
	"theme-card": '[role="group"]',
	"split-button": '[role="group"]',
	splitter: '[role="separator"]',
	toast: '[role="status"]',
	alert: '[role="status"]',
	tooltip: '[role="tooltip"]',
	bar: '[role="img"]',
	chart: '[role="img"]',
	sparkline: '[role="img"]',
	heatmap: "table",
	pie: '[role="img"]',
	qr: '[role="img"]',
	select: "select",
	textarea: "textarea",
};

const OWN_LABELLEDBY_ELEMENT: Record<string, string> = {
	dialog: "dialog",
	sheet: "dialog",
	popover: "dialog",
	checkbox: 'input[type="checkbox"]',
	"checkbox-group": '[role="group"]',
	radio: 'input[type="radio"]',
	"radio-group": '[role="radiogroup"]',
	switch: '[role="switch"]',
	slider: '[role="slider"]',
	"number-input": '[role="spinbutton"]',
	"color-picker": '[role="group"]',
	splitter: '[role="separator"]',
	tree: '[role="tree"]',
	tabs: '[role="tablist"]',
	"date-picker": '[part="control"]',
	list: '[part="list"]',
	segmented: '[role="radiogroup"]',
	calendar: "[data-root]",
};

const SETUP: Record<string, Record<string, string>> = {
	bar: { series: "[1,2]" },
	chart: { series: JSON.stringify([{ name: "A", points: [0, 1, 2].map((i) => ({ at: 1_700_000_000_000 + i * 60_000, value: i + 1 })) }]) },
	sparkline: { values: "1,2,3" },
	heatmap: { values: "[[1,2],[3,4]]" },
	pie: { data: "[1,2]" },
	qr: { value: "hi" },
};

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

async function mount(id: string, attrs: Record<string, string>): Promise<HTMLElement> {
	const el = document.createElement(`xtyle-${id}`);
	for (const [name, value] of Object.entries({ ...SETUP[id], ...attrs })) el.setAttribute(name, value);
	document.body.append(el);
	await settle();
	return el;
}

function named(el: HTMLElement, id: string): { label: string | null; labelledby: string | null } {
	const target = (el.shadowRoot ?? el).querySelector(ROLE_ELEMENT[id]);
	return { label: target?.getAttribute("aria-label") ?? null, labelledby: target?.getAttribute("aria-labelledby") ?? null };
}

describe("a name written on the host reaches the element that carries the role", () => {
	for (const id of Object.keys(ROLE_ELEMENT)) {
		it(`${id}: forwards, follows, and clears the host aria-label`, async () => {
			const el = await mount(id, { "aria-label": "Probe9" });
			expect(named(el, id)).toEqual({ label: "Probe9", labelledby: null });

			el.setAttribute("aria-label", "Probe10");
			await settle();
			expect(named(el, id).label).toBe("Probe10");

			el.removeAttribute("aria-label");
			await settle();
			expect(named(el, id).label).not.toBe("Probe10");
		});

		it(`${id}: resolves the host aria-labelledby in the host's own root`, async () => {
			const source = document.createElement("span");
			source.id = `name-of-${id}`;
			source.textContent = "Outer name";
			document.body.append(source);
			const el = await mount(id, { "aria-labelledby": source.id });
			const name = named(el, id);
			if (el.shadowRoot) expect(name).toEqual({ label: "Outer name", labelledby: null });
			else expect(name.labelledby).toBe(source.id);

			el.removeAttribute("aria-labelledby");
			await settle();
			expect(named(el, id).label).not.toBe("Outer name");
		});
	}

	it("restores the inner element's own name when the host name is removed", async () => {
		const el = await mount("dialog", { label: "Own", "aria-label": "Probe9" });
		expect(named(el, "dialog").label).toBe("Probe9");
		el.removeAttribute("aria-label");
		await settle();
		expect(named(el, "dialog").label).toBe("Own");
	});

	it("lets an explicit aria-label win over the component's own labelledby", async () => {
		const el = await mount("switch", { label: "Visible", "aria-label": "Probe9" });
		expect(named(el, "switch")).toEqual({ label: "Probe9", labelledby: null });
		el.removeAttribute("aria-label");
		await settle();
		expect(named(el, "switch").labelledby).not.toBeNull();
	});

	for (const id of ["select", "textarea"]) {
		it(`${id}: an explicit aria-label wins over the visible label`, async () => {
			const el = await mount(id, { label: "Visible", "aria-label": "Probe9" });
			expect(named(el, id)).toEqual({ label: "Probe9", labelledby: null });
		});
	}
});

describe("a component's own labelledby names its role element from outside the shadow root", () => {
	const ownNamed = (el: HTMLElement, id: string) => {
		const target = (el.shadowRoot ?? el).querySelector(OWN_LABELLEDBY_ELEMENT[id]);
		return { label: target?.getAttribute("aria-label") ?? null, labelledby: target?.getAttribute("aria-labelledby") ?? null };
	};

	for (const id of Object.keys(OWN_LABELLEDBY_ELEMENT)) {
		it(`${id}: resolves labelledby ids that live in the light DOM`, async () => {
			const source = document.createElement("span");
			source.id = `own-name-of-${id}`;
			source.textContent = "Light name";
			document.body.append(source);
			const el = await mount(id, { labelledby: source.id });
			const name = ownNamed(el, id);
			if (el.shadowRoot) expect(name).toEqual({ label: "Light name", labelledby: null });
			else expect(name.labelledby).toBe(source.id);
		});
	}

	it("leaves ids that resolve inside the shadow root as IDREFs", async () => {
		const el = await mount("switch", { label: "Visible" });
		const target = el.shadowRoot?.querySelector('[role="switch"]');
		const ref = target?.getAttribute("aria-labelledby");
		expect(ref).toBeTruthy();
		expect(el.shadowRoot?.getElementById(ref ?? "")).not.toBeNull();
	});
});

describe("a host-named chart keeps its keyboard guidance", () => {
	const plot = (el: HTMLElement) => el.shadowRoot?.querySelector(".xtyle-chart__plot");

	it("moves the hint to aria-description while the host supplies the name", async () => {
		const el = await mount("chart", { "aria-label": "Probe9" });
		expect(plot(el)?.getAttribute("aria-label")).toBe("Probe9");
		expect(plot(el)?.getAttribute("aria-description")).toContain("Use arrow keys");

		el.removeAttribute("aria-label");
		await settle();
		expect(plot(el)?.getAttribute("aria-label")).toContain("Use arrow keys");
		expect(plot(el)?.hasAttribute("aria-description")).toBe(false);
	});

	it("names the selection key too on a selectable chart", async () => {
		const el = await mount("chart", { "aria-label": "Probe9", selectable: "" });
		expect(plot(el)?.getAttribute("aria-description")).toContain("Enter to select");
	});
});

// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/progress.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/progress/source.generated.js";

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function meter(ramp: string): Element {
	document.body.innerHTML = `<xtyle-progress ramp="${ramp}" value="50" max="100" meter aria-label="Temper"></xtyle-progress>`;
	return document.body.firstElementChild as Element;
}

describe("xtyle-progress ramps", () => {
	it("takes a stop list written as CSS tokens, the form its own docs promise", () => {
		const bar = meter("var(--success),var(--warn),var(--danger)");
		expect(bar.shadowRoot?.querySelector('[part="indicator"]') ?? bar.querySelector('[part="indicator"]')).toBeTruthy();
	});

	it("leaves the flat tone in charge rather than vanishing when no stop resolves", () => {
		const bar = meter("var(--nothing-here),var(--nor-this)");
		const root = bar.shadowRoot ?? bar;
		expect(root.querySelector('[part="indicator"]'), "a slightly-wrong meter beats a missing one").toBeTruthy();
		expect(root.querySelector('[part="indicator"]')?.getAttribute("style") ?? "").not.toContain("currentColor");
	});

	it("still reads a built-in palette and an explicit stop array", () => {
		for (const ramp of ["thermal", '[&quot;#0000ff&quot;,&quot;#ff0000&quot;]']) {
			const root = meter(ramp).shadowRoot ?? document.body.firstElementChild!;
			expect(root.querySelector('[part="indicator"]'), ramp).toBeTruthy();
		}
	});
});

type Meter = Element & { effectiveTone: string };

function banded(value: number, bands: string, tone = "accent"): Meter {
	document.body.innerHTML =
		`<xtyle-progress value="${value}" max="100" tone="${tone}" aria-label="Load">${bands}</xtyle-progress>`;
	return document.body.firstElementChild as Meter;
}

const BANDS = `<threshold below="50" tone="success"></threshold><threshold below="80" tone="warn"></threshold>`;

describe("xtyle-progress thresholds", () => {
	it("takes the first band whose ceiling the value falls under", () => {
		expect(banded(10, BANDS).effectiveTone).toBe("success");
		expect(banded(65, BANDS).effectiveTone).toBe("warn");
	});

	it("falls through to the flat tone above every ceiling, rather than banding on the last one", () => {
		expect(banded(95, BANDS).effectiveTone).toBe("accent");
		expect(banded(100, BANDS, "danger").effectiveTone).toBe("danger");
	});

	it("still lets a band omit `below` to act as the deliberate catch-all", () => {
		const withCatchAll = `${BANDS}<threshold tone="danger"></threshold>`;
		expect(banded(95, withCatchAll).effectiveTone).toBe("danger");
	});
});

function captioned(attrs: string): { host: Element; root: ParentNode } {
	document.body.innerHTML = `<xtyle-progress value="40" max="100" ${attrs}></xtyle-progress>`;
	const host = document.body.firstElementChild as Element;
	return { host, root: host.shadowRoot ?? host };
}

const text = (root: ParentNode, part: string): string | null =>
	root.querySelector(`[part="${part}"]`)?.textContent?.trim() ?? null;

describe("xtyle-progress says on screen what it is", () => {
	it("renders a caption, a reading, and a note when they are set", () => {
		const { root } = captioned(`label="The haggle" reading="8/20" note="They will not budge much further"`);
		expect(text(root, "label")).toBe("The haggle");
		expect(text(root, "reading")).toBe("8/20");
		expect(text(root, "note")).toBe("They will not budge much further");
	});

	it("draws no caption and no note when nothing fills them, rather than an empty strip", () => {
		const { root } = captioned(`aria-label="Load"`);
		expect(root.querySelector('[part="caption"]')).toBeNull();
		expect(root.querySelector('[part="note"]')).toBeNull();
	});

	it("takes a reading no value format could have produced", () => {
		for (const reading of ["even", "yours", "46 left"]) {
			expect(text(captioned(`label="Standing" reading="${reading}"`).root, "reading")).toBe(reading);
		}
	});

	it("keeps the caption out of the measuring element, so it is not read as part of it", () => {
		const { root } = captioned(`label="The haggle" note="A note"`);
		const bar = root.querySelector('[part="bar"]');
		expect(bar?.getAttribute("role")).toBe("progressbar");
		expect(bar?.querySelector('[part="caption"]'), "the caption is prose beside the bar, not inside it").toBeNull();
		expect(bar?.querySelector('[part="note"]')).toBeNull();
		expect(root.querySelector('[part="progress"]')?.getAttribute("role")).toBeNull();
	});
});

describe("a visible label also names the meter", () => {
	it("announces the caption when nothing else names it, so the string is written once", () => {
		const { root } = captioned(`label="The haggle"`);
		expect(root.querySelector('[part="bar"]')?.getAttribute("aria-label")).toBe("The haggle");
	});

	it("lets an explicit aria-label win when the announced name should differ", () => {
		const { root } = captioned(`label="8/20" aria-label="Coins offered"`);
		expect(root.querySelector('[part="bar"]')?.getAttribute("aria-label")).toBe("Coins offered");
		expect(text(root, "label")).toBe("8/20");
	});

	it("leaves an aria-labelledby pointing where it was told, rather than competing with it", () => {
		const { root } = captioned(`label="The haggle" aria-labelledby="elsewhere"`);
		const bar = root.querySelector('[part="bar"]');
		expect(bar?.getAttribute("aria-labelledby")).toBe("elsewhere");
		expect(bar?.getAttribute("aria-label")).toBeNull();
	});
});

describe("xtyle-progress stands up without being rotated", () => {
	it("grows the indicator along the block axis, so the fill is a real height", () => {
		const { root } = captioned(`orient="vertical" aria-label="Fuel"`);
		const style = root.querySelector('[part="indicator"]')?.getAttribute("style") ?? "";
		expect(style).toContain("height:40%");
		expect(style).not.toContain("width:");
	});

	it("tells assistive tech which way it runs", () => {
		expect(captioned(`orient="vertical" aria-label="Fuel"`).root.querySelector('[part="bar"]')?.getAttribute("aria-orientation")).toBe("vertical");
		expect(captioned(`aria-label="Fuel"`).root.querySelector('[part="bar"]')?.getAttribute("aria-orientation")).toBeNull();
	});

	it("ignores the ask on a ring, which has no axis to stand up", () => {
		const { root } = captioned(`orient="vertical" variant="circular" aria-label="Fuel"`);
		expect(root.querySelector(".xtyle-progress")?.className).not.toContain("xtyle-progress--vertical");
	});

	it("sweeps a vertical gradient ramp from the bottom rather than from the left", () => {
		const { root } = captioned(`orient="vertical" ramp="thermal" ramp-mode="gradient" aria-label="Heat"`);
		const style = root.querySelector('[part="indicator"]')?.getAttribute("style") ?? "";
		expect(style).toContain("linear-gradient(0deg");
		expect(style).toContain("background-position:bottom");
	});
});

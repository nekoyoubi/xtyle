// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/segmented.js";
import "../src/elements/switch.js";
import "../src/elements/select.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest as segManifest, fragmentSources as segSources } from "../src/elements/fragments/segmented/source.generated.js";
import { manifest as swManifest, fragmentSources as swSources } from "../src/elements/fragments/switch/source.generated.js";
import { manifest as selManifest, fragmentSources as selSources } from "../src/elements/fragments/select/source.generated.js";

beforeAll(async () => {
	await loadFill(segManifest, segSources);
	await loadFill(swManifest, swSources);
	await loadFill(selManifest, selSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function make(tag: string, attrs: Record<string, string>): HTMLElement {
	const el = document.createElement(tag);
	for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
	document.body.append(el);
	return el;
}

function controls(host: HTMLElement, selector: string): Element[] {
	return [...(host.shadowRoot ?? host).querySelectorAll(selector)];
}

describe("focusable is one convention, not a per-component prop", () => {
	it("segmented takes every option out of the tab order, overriding the roving stop", async () => {
		const on = make("xtyle-segmented", { options: "One,Two,Three", value: "One" });
		const off = make("xtyle-segmented", { options: "One,Two,Three", value: "One", focusable: "false" });
		await new Promise((r) => setTimeout(r, 0));
		expect(
			controls(on, '[role="radio"]').map((c) => c.getAttribute("tabindex")),
			"no options rendered at all means the fill threw, not that the stops are right",
		).toContain("0");
		const stops = controls(off, '[role="radio"]').map((c) => c.getAttribute("tabindex"));
		expect(stops.every((t) => t === "-1"), `roving stop survived: ${stops.join(",")}`).toBe(true);
	});

	it("switch takes its track out of the tab order", () => {
		expect(controls(make("xtyle-switch", {}), '[role="switch"]')[0]?.getAttribute("tabindex") ?? "").toBe("");
		expect(
			controls(make("xtyle-switch", { focusable: "false" }), '[role="switch"]')[0]?.getAttribute("tabindex"),
		).toBe("-1");
	});

	it("select takes its native control out of the tab order", () => {
		expect(controls(make("xtyle-select", { label: "Pick" }), "select")[0]?.getAttribute("tabindex") ?? "").toBe("");
		expect(
			controls(make("xtyle-select", { label: "Pick", focusable: "false" }), "select")[0]?.getAttribute("tabindex"),
		).toBe("-1");
	});

	it("restores the tab order when the opt-out is dropped", () => {
		const el = make("xtyle-switch", { focusable: "false" });
		el.setAttribute("focusable", "true");
		expect(controls(el, '[role="switch"]')[0]?.getAttribute("tabindex") ?? "").toBe("");
	});
});

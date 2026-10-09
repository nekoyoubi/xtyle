// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/switch.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/switch/source.generated.js";
import { switchCss } from "../src/css/components/switch.js";
import { switchHostCss } from "../src/markup/switch.js";
import { componentsCss } from "../src/css/components.js";

type SwitchEl = HTMLElement & { checked: boolean; spread: boolean };

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function make(attrs: Record<string, string> = {}): SwitchEl {
	const el = document.createElement("xtyle-switch") as SwitchEl;
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	document.body.appendChild(el);
	return el;
}

function part(el: HTMLElement, name: string): HTMLElement {
	const root = el.shadowRoot ?? el;
	return root.querySelector(`[part="${name}"]`) as HTMLElement;
}

function changes(el: HTMLElement): boolean[] {
	const log: boolean[] = [];
	el.addEventListener("change", (e) => log.push((e as CustomEvent).detail.checked));
	return log;
}

describe("<xtyle-switch> label as a target", () => {
	it("toggles exactly once when the label is clicked", () => {
		const el = make({ label: "Wi-Fi" });
		const log = changes(el);
		part(el, "label").click();
		expect(el.checked).toBe(true);
		expect(log).toEqual([true]);
		part(el, "label").click();
		expect(el.checked).toBe(false);
		expect(log).toEqual([true, false]);
	});

	it("still toggles exactly once from the track", () => {
		const el = make({ label: "Wi-Fi" });
		const log = changes(el);
		part(el, "track").click();
		expect(log).toEqual([true]);
	});

	it("does not toggle from the label while disabled", () => {
		const el = make({ label: "Locked", disabled: "" });
		const log = changes(el);
		part(el, "label").click();
		expect(el.checked).toBe(false);
		expect(log).toEqual([]);
	});

	it("toggles from the label again once re-enabled", () => {
		const el = make({ label: "Locked", disabled: "" });
		el.removeAttribute("disabled");
		part(el, "label").click();
		expect(el.checked).toBe(true);
	});

	it("leaves the label out of the tab order and keeps the track as the switch", () => {
		const el = make({ label: "Wi-Fi" });
		expect(part(el, "label").hasAttribute("tabindex")).toBe(false);
		expect(part(el, "track").getAttribute("role")).toBe("switch");
	});
});

describe("<xtyle-switch> spread", () => {
	it("reflects the property to the attribute", () => {
		const el = make({ label: "Wi-Fi" });
		expect(el.spread).toBe(false);
		el.spread = true;
		expect(el.hasAttribute("spread")).toBe(true);
		el.spread = false;
		expect(el.hasAttribute("spread")).toBe(false);
	});

	it("puts the spread class on the row and drops it again", () => {
		const el = make({ label: "Wi-Fi", spread: "" });
		expect(part(el, "switch").classList.contains("xtyle-switch--spread")).toBe(true);
		el.removeAttribute("spread");
		expect(part(el, "switch").classList.contains("xtyle-switch--spread")).toBe(false);
	});

	it("ships the rules the class and attribute key on", () => {
		expect(switchHostCss).toContain(":host([spread]) { display: flex; }");
		expect(componentsCss).toContain("xtyle-switch[spread] { display: flex; }");
		expect(switchCss).toMatch(/\.xtyle-switch--spread \{[^}]*display: flex;[^}]*width: 100%;/);
		expect(switchCss).toMatch(/\.xtyle-switch--spread \.xtyle-switch__label \{[^}]*flex: 1 1 auto;/);
	});
});

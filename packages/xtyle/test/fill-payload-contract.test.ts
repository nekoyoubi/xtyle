// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import hostManifest from "../src/elements/fragments/component-host.json" with { type: "json" };
import { FragmentHost } from "../src/elements/fragment-host.js";
import "../src/elements/field.js";
import "../src/elements/select.js";
import "../src/elements/textarea.js";
import "../src/elements/radio.js";
import "../src/elements/checkbox.js";
import "../src/elements/combobox.js";
import "../src/elements/date-picker.js";

type Slot = { id: string; payload?: { properties?: Record<string, unknown>; required?: string[] } };

const slots = (hostManifest as { slots: Slot[] }).slots;

const SEEDS: Record<string, Record<string, string>> = {
	field: { label: "L", name: "n", value: "v" },
	select: { label: "L", name: "n", value: "v" },
	textarea: { label: "L", name: "n", value: "v" },
	radio: { label: "L", name: "n", value: "v" },
	checkbox: { label: "L", name: "n", value: "v" },
	combobox: { label: "L", name: "n", value: "v" },
	"date-picker": { label: "L", name: "n", value: "v" },
};

const observed = new Map<string, Set<string>>();
const realUpdate = FragmentHost.prototype.update;

beforeAll(() => {
	FragmentHost.prototype.update = function (this: FragmentHost, bindings) {
		const id = (this as unknown as { fragmentId?: string }).fragmentId ?? "";
		if (id) {
			const seen = observed.get(id) ?? new Set<string>();
			for (const key of Object.keys(bindings)) seen.add(key);
			observed.set(id, seen);
		}
		return realUpdate.call(this, bindings);
	};
});

afterEach(() => {
	document.body.innerHTML = "";
});

function mount(id: string): void {
	const el = document.createElement(`xtyle-${id}`);
	for (const [k, v] of Object.entries(SEEDS[id] ?? {})) el.setAttribute(k, v);
	document.body.appendChild(el);
}

describe("a declared fill payload matches what the host actually hands the fill", () => {
	for (const slot of slots.filter((s) => s.payload)) {
		const id = slot.id.replace(/^component\./, "");
		it(`${id} declares exactly the bindings it passes`, () => {
			mount(id);
			const passed = [...(observed.get(id) ?? new Set<string>())].sort();
			const declared = Object.keys(slot.payload?.properties ?? {}).sort();
			expect(
				declared,
				`${id}'s payload has drifted from the bindings the element passes. A fill author codes against the schema, so a stale one is worse than none.`,
			).toEqual(passed);
		});
	}

	it("holds the form-bearing roster to its declared and pending halves", () => {
		const declared = ["checkbox", "combobox", "date-picker", "field", "radio", "select", "textarea"];
		const pending: string[] = [];
		const has = (id: string) => !!slots.find((s) => s.id === `component.${id}`)?.payload;

		expect(declared.filter((id) => !has(id)), "a slot lost the payload it had declared").toEqual([]);
		expect(
			pending.filter((id) => has(id)),
			"a pending slot grew a payload without moving to the declared list — move it, so the roster keeps naming what is still uncovered rather than quietly shrinking",
		).toEqual([]);
	});
});

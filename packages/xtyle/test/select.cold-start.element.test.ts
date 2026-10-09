// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import "../src/elements/select.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/select/source.generated.js";

type Select = HTMLElement & { value: string };

afterEach(() => {
	document.body.innerHTML = "";
});

const field = (el: HTMLElement): HTMLSelectElement | null =>
	(el.shadowRoot ?? el).querySelector<HTMLSelectElement>("select");

function option(value: string): HTMLOptionElement {
	const o = document.createElement("option");
	o.value = value;
	o.textContent = value.toUpperCase();
	return o;
}

const settle = async (): Promise<void> => {
	await loadFill(manifest, fragmentSources);
	for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
};

describe("select shows its given value when the fill loads after the value", () => {
	it("an attribute value with options present at connect", async () => {
		const el = document.createElement("xtyle-select") as Select;
		el.setAttribute("label", "Pick");
		el.setAttribute("value", "c");
		el.append(option("a"), option("b"), option("c"));
		document.body.appendChild(el);
		await settle();
		expect(field(el)?.value).toBe("c");
	});

	it("an attribute value with options that arrive after connect", async () => {
		const el = document.createElement("xtyle-select") as Select;
		el.setAttribute("label", "Pick");
		el.setAttribute("value", "c");
		document.body.appendChild(el);
		el.append(option("a"), option("b"), option("c"));
		await settle();
		expect(field(el)?.value).toBe("c");
	});

	it("a property value set before any option exists", async () => {
		const el = document.createElement("xtyle-select") as Select;
		el.setAttribute("label", "Pick");
		document.body.appendChild(el);
		el.value = "c";
		await Promise.resolve();
		el.append(option("a"), option("b"), option("c"));
		await settle();
		expect(field(el)?.value).toBe("c");
		expect(el.value).toBe("c");
	});

	it("options that arrive one at a time after the value", async () => {
		const el = document.createElement("xtyle-select") as Select;
		el.setAttribute("label", "Pick");
		el.setAttribute("value", "c");
		document.body.appendChild(el);
		for (const v of ["a", "b", "c"]) {
			el.append(option(v));
			await new Promise((r) => setTimeout(r, 0));
		}
		await settle();
		expect(field(el)?.value).toBe("c");
	});
});

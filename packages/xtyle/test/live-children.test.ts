// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/select.js";
import { loadFill } from "../src/elements/fragment-host.js";
import * as selectFill from "../src/elements/fragments/select/source.generated.js";

beforeAll(async () => {
	await loadFill(selectFill.manifest, selectFill.fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

const projected = (el: Element): number => (el.shadowRoot ?? el).querySelectorAll("option").length;
const flush = () => new Promise((r) => setTimeout(r, 0));
const option = (value: string): HTMLOptionElement => {
	const node = document.createElement("option");
	node.value = value;
	node.textContent = value;
	return node;
};

/**
 * A component reading `this.children` holds a copy taken at render time, and every framework renders a
 * list as an effect that runs *after* the element is inserted. The literal child written in a template
 * is present at connect and the loop-rendered sibling is not, so the same element shows one item and
 * silently drops the rest — which reads as correctly wired rather than as broken.
 */
describe("a light-DOM child list stays live after connect", () => {
	it("projects options appended after the element upgraded", async () => {
		document.body.innerHTML = `<xtyle-select label="Look"><option value="">pick…</option></xtyle-select>`;
		const el = document.body.firstElementChild as HTMLElement;
		for (const id of ["dusk", "ember", "slate"]) el.append(option(id));
		await flush();
		expect(projected(el)).toBe(4);
	});

	it("projects an async list that was empty at connect", async () => {
		document.body.innerHTML = `<xtyle-select label="Look"></xtyle-select>`;
		const el = document.body.firstElementChild as HTMLElement;
		el.append(option("fetched"));
		await flush();
		expect(projected(el)).toBe(1);
	});

	/** An `optgroup`'s options are grandchildren, so a grouped list would otherwise only update when the
	 * group set changed rather than the option set. Asserted through a sibling the projection can carry,
	 * because happy-dom will not parse `optgroup` markup into a `select`. */
	it("re-renders for a change nested below a direct child", async () => {
		document.body.innerHTML = `<xtyle-select label="Look"><optgroup label="warm"></optgroup></xtyle-select>`;
		const el = document.body.firstElementChild as HTMLElement;
		el.append(option("slate"));
		await flush();
		expect(projected(el)).toBe(1);

		el.querySelector("optgroup")?.append(option("ember"));
		el.append(option("dusk"));
		await flush();
		expect(projected(el)).toBe(2);
	});

	it("drops an option that goes away", async () => {
		document.body.innerHTML = `<xtyle-select label="Look"><option value="a">a</option><option value="b">b</option></xtyle-select>`;
		const el = document.body.firstElementChild as HTMLElement;
		el.querySelector("option")?.remove();
		await flush();
		expect(projected(el)).toBe(1);
	});

	it("follows a relabelled option, whose text is a character-data change and not a child one", async () => {
		document.body.innerHTML = `<xtyle-select label="Look"><option value="a">before</option></xtyle-select>`;
		const el = document.body.firstElementChild as HTMLElement;
		const first = el.querySelector("option") as HTMLOptionElement;
		first.textContent = "after";
		await flush();
		expect((el.shadowRoot ?? el).querySelector("option")?.textContent).toBe("after");
	});

	/** The element's own scaffold lands among the author's children under a light render, so an
	 * unfiltered observer would watch itself paint and never settle. */
	it("does not react to its own scaffold", async () => {
		document.body.innerHTML = `<xtyle-select label="Look"><option value="a">a</option></xtyle-select>`;
		const el = document.body.firstElementChild as HTMLElement;
		await flush();
		await flush();
		expect(projected(el)).toBe(1);
	});
});

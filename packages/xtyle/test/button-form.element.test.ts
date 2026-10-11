// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/button.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/button/source.generated.js";

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function mount(markup: string): HTMLElement {
	document.body.innerHTML = markup;
	return document.querySelector("xtyle-button") as HTMLElement;
}

const inner = (host: HTMLElement): HTMLButtonElement =>
	(host.shadowRoot ?? host).querySelector('button[part="button"]') as HTMLButtonElement;

describe("xtyle-button and its form", () => {
	it("is form-associated, so a shadow-rendered button can reach a form at all", () => {
		expect((customElements.get("xtyle-button") as unknown as { formAssociated?: boolean }).formAssociated).toBe(true);
		expect(customElements.get("xtyle-button")?.observedAttributes).toContain("form");
	});

	it("keeps the shadow control inert, since the host submits on its behalf", () => {
		const button = mount(`<xtyle-button type="submit">Save</xtyle-button>`);
		expect(button.shadowRoot).not.toBeNull();
		expect(inner(button).type).toBe("button");
	});
});

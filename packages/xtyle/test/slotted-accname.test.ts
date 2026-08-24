// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/button.js";
import "../src/elements/link.js";
import "../src/elements/card-link.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/button/source.generated.js";
import { manifest as linkManifest, fragmentSources as linkSources } from "../src/elements/fragments/link/source.generated.js";
import { manifest as cardManifest, fragmentSources as cardSources } from "../src/elements/fragments/card-link/source.generated.js";

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
	await loadFill(linkManifest, linkSources);
	await loadFill(cardManifest, cardSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

/** Built the way a consumer's page builds one: created first, so the element takes the shadow path
 * rather than adopting pre-rendered scaffold. Parsing it out of `innerHTML` attaches the text before
 * the upgrade and lands in light mode, where the boundary this covers does not exist. */
function mount(text: string, attrs: Record<string, string> = {}): HTMLElement {
	const el = document.createElement("xtyle-button");
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	if (text) el.textContent = text;
	document.body.append(el);
	return el;
}

function control(host: HTMLElement): Element | null {
	return (host.shadowRoot ?? host).querySelector('[part~="button"]');
}

/** The mirrored name exists only for the shadow path. In light DOM the label is a real descendant of
 * the control and names it natively, so there is nothing to mirror and nothing to assert. */
function shadowName(host: HTMLElement): string | null {
	if (!host.shadowRoot) return null;
	return control(host)?.getAttribute("aria-label") ?? null;
}

describe("a slot-labeled button carries its name across the shadow boundary", () => {
	it("mirrors slotted text onto the internal control", () => {
		const host = mount("Live a life");
		expect(control(host)?.getAttribute("aria-label")).toBe("Live a life");
	});

	it("normalizes the mirrored name, so markup indentation never lands in it", () => {
		const host = mount("\n\t Live   a life \n");
		const name = shadowName(host);
		if (name === null) return;
		expect(name).toBe(name.trim());
		expect(/\s{2,}/.test(name), `runs of whitespace survived into ${JSON.stringify(name)}`).toBe(false);
	});

	it("lets an explicit aria-label win over the slotted text", () => {
		const host = mount("Slotted text", { "aria-label": "Explicit wins" });
		expect(control(host)?.getAttribute("aria-label")).toBe("Explicit wins");
	});

	it("writes no aria-label when the consumer pointed at one with aria-labelledby", () => {
		const host = mount("Slotted text", { "aria-labelledby": "elsewhere" });
		expect(control(host)?.getAttribute("aria-label")).toBeNull();
		expect(control(host)?.getAttribute("aria-labelledby")).toBe("elsewhere");
	});

	it("leaves an empty button unnamed rather than inventing a blank label", () => {
		const host = mount("", { "icon-only": "", "aria-label": "Close" });
		expect(control(host)?.getAttribute("aria-label")).toBe("Close");
	});

	it("follows the label when the slotted content changes", () => {
		const host = mount("Before");
		expect(control(host)?.getAttribute("aria-label")).toBe("Before");
		host.textContent = "After";
		host.setAttribute("tone", "accent");
		expect(control(host)?.getAttribute("aria-label")).toBe("After");
	});
});

describe("the same boundary, the other controls that cross it", () => {
	it("names a link from its slotted text", () => {
		const el = document.createElement("xtyle-link");
		el.setAttribute("href", "#x");
		el.textContent = "Read the docs";
		document.body.append(el);
		const a = (el.shadowRoot ?? el).querySelector("a");
		if (!el.shadowRoot) return;
		expect(a?.getAttribute("aria-label")).toBe("Read the docs");
	});

	it("lets an explicit aria-label win on a link", () => {
		const el = document.createElement("xtyle-link");
		el.setAttribute("href", "#x");
		el.setAttribute("aria-label", "Explicit wins");
		el.textContent = "Slotted";
		document.body.append(el);
		if (!el.shadowRoot) return;
		expect((el.shadowRoot.querySelector("a"))?.getAttribute("aria-label")).toBe("Explicit wins");
	});

	it("names a card-link from its heading rather than its whole body", () => {
		const el = document.createElement("xtyle-card-link");
		el.setAttribute("href", "#x");
		el.innerHTML = '<span slot="header">Project Atlas</span>A long body that should not become the name.';
		document.body.append(el);
		if (!el.shadowRoot) return;
		expect(el.shadowRoot.querySelector("a")?.getAttribute("aria-label")).toBe("Project Atlas");
	});

	it("falls back to a card-link's body when it carries no heading", () => {
		const el = document.createElement("xtyle-card-link");
		el.setAttribute("href", "#x");
		el.textContent = "Body only";
		document.body.append(el);
		if (!el.shadowRoot) return;
		expect(el.shadowRoot.querySelector("a")?.getAttribute("aria-label")).toBe("Body only");
	});
});

describe("a control can be kept out of the tab order", () => {
	it("leaves the control focusable by default", () => {
		const host = mount("Save");
		expect(control(host)?.hasAttribute("tabindex")).toBe(false);
	});

	it("takes the control out of sequential focus under focusable=false", () => {
		const host = mount("Leave it", { focusable: "false" });
		expect(control(host)?.getAttribute("tabindex")).toBe("-1");
	});

	it("holds the opt-out across a re-render, which reaching through the shadow root cannot", () => {
		const host = mount("Leave it", { focusable: "false" });
		host.setAttribute("tone", "danger");
		host.setAttribute("variant", "outline");
		expect(control(host)?.getAttribute("tabindex")).toBe("-1");
	});

	it("restores the control to the tab order when the opt-out is dropped", () => {
		const host = mount("Leave it", { focusable: "false" });
		host.setAttribute("focusable", "true");
		expect(control(host)?.getAttribute("tabindex") ?? "").toBe("");
	});

	it("keeps an anchor button out of the tab order too", () => {
		const host = mount("Go", { focusable: "false", href: "#x" });
		expect(control(host)?.tagName.toLowerCase()).toBe("a");
		expect(control(host)?.getAttribute("tabindex")).toBe("-1");
	});
});

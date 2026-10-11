// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import "../src/elements/accordion.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { manifest, fragmentSources } from "../src/elements/fragments/accordion/source.generated.js";

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

const settle = () => new Promise((r) => setTimeout(r, 0));

function accordion(): HTMLElement {
	const el = document.createElement("xtyle-accordion");
	el.setAttribute("multiple", "");
	el.innerHTML = ["a", "b", "c"]
		.map((k) => `<span slot="header" value="${k}"${k === "b" ? " open" : ""}>H-${k}</span><div slot="panel">P-${k}</div>`)
		.join("");
	document.body.appendChild(el);
	return el;
}

function rows(el: HTMLElement): string[] {
	return [...el.shadowRoot!.querySelectorAll("details")].map((details) => {
		const [header, panel] = [...details.querySelectorAll("slot")].map((slot) => slot.getAttribute("name"));
		const text = (name: string | null) => el.querySelector(`[slot="${name}"]`)?.textContent;
		return `${details.getAttribute("data-key")}:${text(header)}/${text(panel)}/${details.hasAttribute("open") ? "open" : "shut"}`;
	});
}

describe("accordion header-row actions", () => {
	function withActions(markup: string): HTMLElement {
		const el = document.createElement("xtyle-accordion");
		el.setAttribute("multiple", "");
		el.innerHTML = markup;
		document.body.appendChild(el);
		return el;
	}

	const actionsOf = (el: HTMLElement, key: string): string | undefined => {
		const region = el.shadowRoot!.querySelector(`.xtyle-accordion__section[data-key="${key}"] > .xtyle-accordion__actions`);
		const slot = region?.querySelector("slot")?.getAttribute("name");
		return slot ? el.querySelector(`[slot="${slot}"]`)?.textContent ?? "" : undefined;
	};

	it("renders actions as a sibling of the summary, never inside it", async () => {
		const el = withActions(`<span slot="header" value="a">A</span><span slot="actions"><button>up</button></span><div slot="panel">P</div>`);
		await settle();
		const section = el.shadowRoot!.querySelector('.xtyle-accordion__section[data-key="a"]')!;
		expect(section.querySelector("summary .xtyle-accordion__actions")).toBeNull();
		expect(section.querySelector(".xtyle-accordion__actions")?.parentElement).toBe(section);
		expect(actionsOf(el, "a")).toBe("up");
	});

	it("gives interleaved actions to the header before them, skipping sections with none", async () => {
		const el = withActions(
			`<span slot="header" value="a">A</span><div slot="panel">PA</div>` +
				`<span slot="header" value="b">B</span><span slot="actions">for b</span><div slot="panel">PB</div>`,
		);
		await settle();
		expect(actionsOf(el, "a")).toBeUndefined();
		expect(actionsOf(el, "b")).toBe("for b");
	});

	it("pairs grouped actions by index", async () => {
		const el = withActions(
			`<span slot="header" value="a">A</span><span slot="header" value="b">B</span>` +
				`<div slot="panel">PA</div><div slot="panel">PB</div><span slot="actions">for a</span><span slot="actions">for b</span>`,
		);
		await settle();
		expect(actionsOf(el, "a")).toBe("for a");
		expect(actionsOf(el, "b")).toBe("for b");
	});

	it("moves the actions with their section", async () => {
		const el = withActions(
			["a", "b"].map((k) => `<span slot="header" value="${k}">H-${k}</span><span slot="actions">act-${k}</span><div slot="panel">P-${k}</div>`).join(""),
		);
		await settle();
		const header = el.querySelector('[value="b"]') as HTMLElement;
		const actions = header.nextElementSibling as HTMLElement;
		el.prepend(header, actions, actions.nextElementSibling as HTMLElement);
		await settle();
		expect(el.shadowRoot!.querySelector(".xtyle-accordion__section")?.getAttribute("data-key")).toBe("b");
		expect(actionsOf(el, "b")).toBe("act-b");
		expect(actionsOf(el, "a")).toBe("act-a");
	});
});

describe("accordion sections that move", () => {
	it("re-match by key when their authored pairs are reordered", async () => {
		const el = accordion();
		await settle();
		const header = el.querySelector('[value="b"]') as HTMLElement;
		el.prepend(header, header.nextElementSibling as HTMLElement);
		await settle();
		expect(rows(el)).toEqual(["b:H-b/P-b/open", "a:H-a/P-a/shut", "c:H-c/P-c/shut"]);
	});

	it("keep keyboard focus on the moved section's trigger", async () => {
		const el = accordion();
		await settle();
		const trigger = el.shadowRoot!.querySelector<HTMLElement>('.xtyle-accordion__trigger[data-key="c"]')!;
		trigger.focus();
		const header = el.querySelector('[value="c"]') as HTMLElement;
		el.prepend(header, header.nextElementSibling as HTMLElement);
		await settle();
		expect(el.shadowRoot!.activeElement?.getAttribute("data-key")).toBe("c");
		expect(rows(el)[0]).toBe("c:H-c/P-c/shut");
	});
});

// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { resolveFormatProfile, sanitizeFragment } from "@xriptjs/sanitize";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import "../src/elements/number-format.js";
import { loadFill } from "../src/elements/fragment-host.js";
import { renderFragmentLight } from "../src/elements/fragment-ssr.js";
import { manifest, fragmentSources } from "../src/elements/fragments/number-format/source.generated.js";

type NumberFormatElement = HTMLElement & { formatted: string; value: number | null; grouping: boolean | string };

beforeAll(async () => {
	await loadFill(manifest, fragmentSources);
});

afterEach(() => {
	document.body.innerHTML = "";
});

function make(attrs: Record<string, string> = {}, parent: HTMLElement = document.body): NumberFormatElement {
	const el = document.createElement("xtyle-number-format") as NumberFormatElement;
	for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
	parent.appendChild(el);
	return el;
}

const data = (el: HTMLElement): HTMLElement =>
	(el.shadowRoot ?? el).querySelector<HTMLElement>('[part="number"]') as HTMLElement;

describe("<xtyle-number-format>", () => {
	it("renders a <data> carrying the raw value and the formatted text", () => {
		const el = make({ value: "1299.5", format: "currency", locale: "en-US" });
		const node = data(el);
		expect(node.tagName).toBe("DATA");
		expect(node.getAttribute("value")).toBe("1299.5");
		expect(node.textContent).toBe("$1,299.50");
		expect(el.formatted).toBe("$1,299.50");
	});

	it("re-renders on an attribute change", () => {
		const el = make({ value: "0.42", locale: "en-US" });
		expect(data(el).textContent).toBe("0.42");
		el.setAttribute("format", "percent");
		expect(data(el).textContent).toBe("42%");
		el.setAttribute("value", "0.5");
		expect(data(el).getAttribute("value")).toBe("0.5");
		expect(data(el).textContent).toBe("50%");
		el.grouping = "false";
		expect(el.getAttribute("grouping")).toBe("false");
	});

	it("takes its locale from the nearest lang when it has none of its own", () => {
		const section = document.createElement("section");
		section.setAttribute("lang", "de-DE");
		document.body.appendChild(section);
		const el = make({ value: "1234.5" }, section);
		expect(data(el).textContent).toBe("1.234,5");
		el.setAttribute("locale", "en-US");
		expect(data(el).textContent).toBe("1,234.5");
	});

	it("renders the fallback with no value attribute on the <data>", () => {
		const el = make({ value: "", fallback: "n/a" });
		expect(data(el).textContent).toBe("n/a");
		expect(data(el).getAttribute("value") ?? "").toBe("");
		expect(el.value).toBeNull();
	});

	it("inks a tone and switches tabular figures off through the fill's class", () => {
		const el = make({ value: "3", tone: "success", tabular: "false" });
		expect(data(el).classList.contains("xtyle-number-format--success")).toBe(true);
		expect(data(el).classList.contains("xtyle-number-format--proportional")).toBe(true);
	});

	it("server-renders the same <data> markup", async () => {
		const html = await renderFragmentLight("number-format", { formatted: "$1,299.50", value: "1299.5", tone: null, tabular: true });
		expect(html).toContain('<data part="number" class="xtyle-number-format" value="1299.5">$1,299.50</data>');
	});

	it("keeps <data> and its value through the fill sanitizer", () => {
		const here = dirname(fileURLToPath(import.meta.url));
		const host = JSON.parse(readFileSync(resolve(here, "../src/elements/fragments/component-host.json"), "utf8"));
		const profile = resolveFormatProfile("application/x-xtyle+html", host.formats, host.vocabularies);
		const result = sanitizeFragment('<data part="number" class="xtyle-number-format" value="4">4</data>', profile!);
		expect(result.strippedElements).toEqual([]);
		expect(result.strippedAttributes).toEqual([]);
	});
});

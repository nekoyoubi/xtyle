// @vitest-environment happy-dom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import "../src/elements/index.js";
import { loadAllFills } from "./all-fills.js";

beforeAll(() => loadAllFills());
import { listComponents } from "../src/manifest/registry.js";

afterEach(() => {
	document.body.innerHTML = "";
	vi.restoreAllMocks();
});

const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

const OPEN: Record<string, string> = {
	"icon.name": "takes any registered glyph or a generated-mark spec; an unknown name already paints a visible placeholder",
	"rating.tone": "takes any register token name as var(--<name>), not only the tone roster",
};

describe("an attribute outside its published options says so", () => {
	it("warns rather than silently rendering the default", async () => {
		const silent: string[] = [];
		for (const m of listComponents()) {
			const ctor = customElements.get(`xtyle-${m.id}`);
			if (!ctor) continue;
			const observed = (ctor as unknown as { observedAttributes?: string[] }).observedAttributes ?? [];
			for (const prop of m.props) {
				if (!prop.options?.length || !prop.bindings?.includes("html")) continue;
				const attr = observed.includes(prop.name) ? prop.name : kebab(prop.name);
				if (!observed.includes(attr) || Object.hasOwn(OPEN, `${m.id}.${attr}`)) continue;
				const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
				const el = document.createElement(`xtyle-${m.id}`);
				el.setAttribute(attr, "nope-9");
				document.body.append(el);
				await Promise.resolve();
				await new Promise((r) => setTimeout(r, 0));
				if (!warn.mock.calls.some((c) => String(c[0]).includes('"nope-9"'))) silent.push(`${m.id}.${attr}`);
				warn.mockRestore();
				el.remove();
			}
		}
		expect(silent).toEqual([]);
	});
});

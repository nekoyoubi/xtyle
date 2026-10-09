// @vitest-environment happy-dom
import { beforeAll, describe, expect, it } from "vitest";
import "../src/elements/index.js";
import { loadAllFills } from "./all-fills.js";

beforeAll(() => loadAllFills());
import { listComponents } from "../src/manifest/registry.js";
import type { ComponentManifest } from "../src/manifest/types.js";

function elementRender(id: string): ComponentManifest["render"] {
	if (!customElements.get(`xtyle-${id}`)) return "light";
	const el = document.createElement(`xtyle-${id}`) as unknown as { styleMode: string };
	const mode = el.styleMode;
	return mode === "isolated" ? "shadow" : mode === "auto" ? "auto" : "light";
}

describe("render says where a component's structure lives", () => {
	it("matches the element's own style mode", () => {
		const drift = listComponents()
			.map((m) => ({ id: m.id, declared: m.render, actual: elementRender(m.id) }))
			.filter((r) => r.declared !== r.actual)
			.map((r) => `${r.id}: declares ${r.declared}, renders ${r.actual}`);
		expect(drift).toEqual([]);
	});

	it("agrees with what a bare-created element actually attaches", () => {
		for (const m of listComponents()) {
			if (!customElements.get(`xtyle-${m.id}`)) continue;
			const el = document.createElement(`xtyle-${m.id}`);
			expect(el.shadowRoot !== null, m.id).toBe(m.render !== "light");
		}
	});

	it("publishes no parts for a light component, where ::part() cannot apply", () => {
		const light = listComponents().filter((m) => m.render === "light" && (m.exposedParts ?? []).length > 0);
		expect(light.map((m) => m.id)).toEqual([]);
	});
});

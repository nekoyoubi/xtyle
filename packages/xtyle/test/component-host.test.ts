import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const fragmentsDir = resolve(here, "../src/elements/fragments");
const host = JSON.parse(readFileSync(resolve(fragmentsDir, "component-host.json"), "utf8")) as {
	slots: { id: string; description?: string; capability?: string; accepts?: string[] }[];
	capabilities: Record<string, { description?: string; risk?: string }>;
	vocabularies: Record<string, { nodes: Record<string, { props?: Record<string, { sink?: string }> }> }>;
};

const isDataSlot =(slot: { accepts?: string[] }) => (slot.accepts ?? []).includes("application/json");
const markupSlots = host.slots.filter((s) => !isDataSlot(s));
const dataSlots = host.slots.filter(isDataSlot);
const componentSlots = host.slots.filter((s) => s.id.startsWith("component."));
const componentNodes = host.vocabularies["xtyle.components"].nodes;

interface ModManifest {
	capabilities?: string[];
	fills?: Record<string, { id: string; source: string }[]>;
}

function builtinFill(slotId: string): ModManifest | null {
	const path = resolve(fragmentsDir, slotId.replace(/^component\./, ""), "mod.manifest.json");
	return existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as ModManifest) : null;
}

describe("component host manifest slots", () => {
	it("declares at least one slot", () => {
		expect(host.slots.length).toBeGreaterThan(0);
	});

	it("every slot carries a non-empty description", () => {
		const undescribed = host.slots.filter((s) => !s.description || s.description.trim() === "").map((s) => s.id);
		expect(undescribed).toEqual([]);
	});

	it("every slot names its capability", () => {
		const uncapable = host.slots.filter((s) => !s.capability).map((s) => s.id);
		expect(uncapable).toEqual([]);
	});

	it("every markup slot is filled by a built-in fragment", () => {
		const dead = markupSlots.filter((s) => {
			const mod = builtinFill(s.id);
			return !mod?.fills?.[s.id]?.length;
		});
		expect(dead.map((s) => s.id)).toEqual([]);
	});

	it("every built-in fill holds the capability its slot gates on", () => {
		const ungranted = markupSlots.filter((s) => {
			const mod = builtinFill(s.id);
			return mod !== null && !mod.capabilities?.includes(s.capability as string);
		});
		expect(ungranted.map((s) => s.id)).toEqual([]);
	});

	it("every data slot says what shape it accepts", () => {
		const vague = dataSlots.filter((s) => !/\bkeyed by\b/.test(s.description ?? ""));
		expect(vague.map((s) => s.id)).toEqual([]);
	});

	it("declares exactly the capabilities its slots gate on", () => {
		const gated = [...new Set(host.slots.map((s) => s.capability as string))].sort();
		expect(Object.keys(host.capabilities).sort()).toEqual(gated);
	});

	it("lets a fill emit every component that has a slot", () => {
		const unemittable = componentSlots
			.map((s) => `xtyle-${s.id.slice("component.".length)}`)
			.filter((tag) => !(tag in componentNodes));
		expect(unemittable).toEqual([]);
	});

	it("gives every src prop a URL sink so the paint keeps it", () => {
		const unsunk = Object.entries(componentNodes)
			.flatMap(([tag, node]) =>
				Object.entries(node.props ?? {})
					.filter(([prop, spec]) => /^(src|href|poster)$|-(src|poster)$/.test(prop) && !spec.sink)
					.map(([prop]) => `${tag}.${prop}`),
			);
		expect(unsunk).toEqual([]);
	});
});

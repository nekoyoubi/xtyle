import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// The component host manifest is the surface a mod author reads to override a component's fill.
// xript's own linter flags an undescribed slot (`undescribed`) and a slot missing its capability;
// this guards both in the test suite so a newly-registered component can't ship a slot that's
// unreachable to the toolchain's checks. (Mirrors what `xript_lint` reports on the host.)
const here = dirname(fileURLToPath(import.meta.url));
const fragmentsDir = resolve(here, "../src/elements/fragments");
const host = JSON.parse(readFileSync(resolve(fragmentsDir, "component-host.json"), "utf8")) as {
	slots: { id: string; description?: string; capability?: string }[];
	capabilities: Record<string, { description?: string; risk?: string }>;
};

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

	// A slot is a promise: grant its capability, ship a fill, and the component renders yours. A slot
	// with no built-in fill keeps none of that — the mod loads, the capability is granted, and nothing
	// happens. The manifest is the API, so a declared slot must be backed by a real `fragments/<id>/`.
	it("every slot is filled by a built-in fragment", () => {
		const dead = host.slots.filter((s) => {
			const mod = builtinFill(s.id);
			return !mod?.fills?.[s.id]?.length;
		});
		expect(dead.map((s) => s.id)).toEqual([]);
	});

	it("every built-in fill holds the capability its slot gates on", () => {
		const ungranted = host.slots.filter((s) => {
			const mod = builtinFill(s.id);
			return mod !== null && !mod.capabilities?.includes(s.capability as string);
		});
		expect(ungranted.map((s) => s.id)).toEqual([]);
	});

	it("declares exactly the capabilities its slots gate on", () => {
		const gated = [...new Set(host.slots.map((s) => s.capability as string))].sort();
		expect(Object.keys(host.capabilities).sort()).toEqual(gated);
	});
});

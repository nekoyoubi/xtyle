import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// The component host manifest is the surface a mod author reads to override a component's fill.
// xript's own linter flags an undescribed slot (`undescribed`) and a slot missing its capability;
// this guards both in the test suite so a newly-registered component can't ship a slot that's
// unreachable to the toolchain's checks. (Mirrors what `xript_lint` reports on the host.)
const here = dirname(fileURLToPath(import.meta.url));
const host = JSON.parse(
	readFileSync(resolve(here, "../src/elements/fragments/component-host.json"), "utf8"),
) as { slots: { id: string; description?: string; capability?: string }[] };

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
});

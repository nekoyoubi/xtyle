import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
	ICON_SHAPE_SLOT,
	iconShapeFillsFrom,
	iconShapeNames,
	registerIconShapeFills,
	resetIconShapes,
	resolveIconPoints,
} from "../src/icon-shapes.js";
import {
	REVEAL_SHAPE_SLOT,
	registerRevealShapeFills,
	resetRevealShapes,
	resolveRevealShape,
	revealShapeNames,
} from "../src/reveal-shapes.js";
import {
	ICON_PRIMITIVE_SLOT,
	hasPrimitive,
	iconPrimitiveFillsFrom,
	registerIconPrimitiveFills,
	resetIconPrimitives,
} from "../src/icon-builder.js";

const here = dirname(fileURLToPath(import.meta.url));
const host = JSON.parse(readFileSync(resolve(here, "../src/elements/fragments/component-host.json"), "utf8")) as {
	slots: { id: string; capability?: string; accepts?: string[] }[];
	capabilities: Record<string, unknown>;
};

afterEach(() => {
	resetIconShapes();
	resetRevealShapes();
	resetIconPrimitives();
});

/**
 * A registry a mod can only reach by running code is half a contribution surface: it cannot be declared
 * in a manifest, so the toolchain never validates it and the capability model never gates it. These are
 * the other half — the slot each registry answers, read the same way `xtyle.icons` is.
 */
describe("shapes arrive by declaration, not only by running code", () => {
	it("answers a slot the host manifest actually declares, with a capability behind it", () => {
		for (const slot of [ICON_SHAPE_SLOT, REVEAL_SHAPE_SLOT, ICON_PRIMITIVE_SLOT]) {
			const declared = host.slots.find((s) => s.id === slot);
			expect(declared, `${slot} has to exist for a mod to declare it`).toBeTruthy();
			expect(declared?.accepts, slot).toContain("application/json");
			expect(host.capabilities[declared!.capability!], slot).toBeTruthy();
		}
	});

	it("keeps the point-list slot and the primitive slot apart", () => {
		expect(ICON_SHAPE_SLOT).not.toBe(ICON_PRIMITIVE_SLOT);
		expect(registerIconShapeFills({ fills: { [ICON_PRIMITIVE_SLOT]: [{ shapes: { blade: "0,0 100,40 20,100" } }] } })).toBe(0);
		expect(registerIconPrimitiveFills({ fills: { [ICON_SHAPE_SLOT]: [{ primitives: { blade: { pts: "0,0 100,40 20,100" } } }] } })).toBe(0);
	});

	it("registers icon primitives a mod declares in its own manifest", () => {
		const added = registerIconPrimitiveFills({
			fills: { [ICON_PRIMITIVE_SLOT]: [{ primitives: { blade: { pts: "0,0 100,40 20,100", tags: ["blade"] } } }] },
		});
		expect(added).toBe(1);
		expect(hasPrimitive("blade")).toBe(true);
		expect(iconPrimitiveFillsFrom({})).toEqual([]);
	});

	it("registers icon point lists a mod declares in its own manifest", () => {
		const added = registerIconShapeFills({ fills: { [ICON_SHAPE_SLOT]: [{ shapes: { blade: "0,0 100,40 20,100" } }] } });
		expect(added).toBe(1);
		expect(iconShapeNames()).toContain("blade");
		expect(resolveIconPoints("blade")).toEqual([0, 0, 100, 40, 20, 100]);
	});

	it("registers reveal silhouettes a mod declares in its own manifest", () => {
		const added = registerRevealShapeFills({
			fills: { [REVEAL_SHAPE_SLOT]: [{ shapes: { notch: { clip: "polygon(0 0, 100% 0, 100% 100%)", gripInset: "8%" } } }] },
		});
		expect(added).toBe(1);
		expect(revealShapeNames()).toContain("notch");
		expect(resolveRevealShape("notch")?.gripInset).toBe("8%");
	});

	it("ignores a manifest that declares nothing, or declares the wrong shape", () => {
		expect(iconShapeFillsFrom({})).toEqual([]);
		expect(iconShapeFillsFrom(null)).toEqual([]);
		expect(registerIconShapeFills({ fills: { [ICON_SHAPE_SLOT]: [{ glyphs: {} }] } })).toBe(0);
		expect(registerRevealShapeFills({ fills: { [REVEAL_SHAPE_SLOT]: [{ shapes: { bad: { gripInset: "1%" } } }] } })).toBe(0);
	});

	it("resets to the built-in set, so one consumer's registration cannot leak into the next test", () => {
		registerIconShapeFills({ fills: { [ICON_SHAPE_SLOT]: [{ shapes: { blade: "0,0 100,40 20,100" } }] } });
		registerRevealShapeFills({ fills: { [REVEAL_SHAPE_SLOT]: [{ shapes: { notch: { clip: "circle(50%)" } } }] } });
		registerIconPrimitiveFills({ fills: { [ICON_PRIMITIVE_SLOT]: [{ primitives: { blade: { pts: "0,0 100,40 20,100" } } }] } });
		resetIconShapes();
		resetRevealShapes();
		resetIconPrimitives();
		expect(hasPrimitive("blade")).toBe(false);
		expect(hasPrimitive("shape-circle"), "the built-ins survive a reset").toBe(true);
		expect(iconShapeNames()).toEqual(["arrow", "pennant"]);
		expect(revealShapeNames()).not.toContain("notch");
		expect(revealShapeNames(), "the built-ins survive a reset").toContain("heart");
	});
});

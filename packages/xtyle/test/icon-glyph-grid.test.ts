import { afterEach, describe, expect, it } from "vitest";
import { ICON_GRID, iconBody, registerIcons, resetIcons } from "../src/icon-registry.js";

afterEach(() => resetIcons());

const PATH = '<path d="M0 0h32v32H0z" fill="currentColor"/>';

/** `translate(tx ty) scale(s)` off a wrapped body, or null when it was not wrapped. */
function transformOf(body: string | undefined): { tx: number; ty: number; scale: number } | null {
	const match = /translate\(([-\d.]+) ([-\d.]+)\) scale\(([-\d.]+)\)/.exec(body ?? "");
	return match ? { tx: Number(match[1]), ty: Number(match[2]), scale: Number(match[3]) } : null;
}

describe("a contributed glyph can state the grid it was drawn on", () => {
	it("leaves a bare body exactly as authored", () => {
		registerIcons({ plain: PATH });
		expect(iconBody("plain")).toBe(PATH);
	});

	it("leaves a glyph already on the roster grid unwrapped", () => {
		registerIcons({ native: { body: PATH, viewBox: `0 0 ${ICON_GRID} ${ICON_GRID}` } });
		expect(iconBody("native")).toBe(PATH);
	});

	it("fits a larger grid down onto the roster's, so 32-grid artwork registers unedited", () => {
		registerIcons({ big: { body: PATH, viewBox: "0 0 32 32" } });
		expect(transformOf(iconBody("big"))).toEqual({ tx: 0, ty: 0, scale: ICON_GRID / 32 });
	});

	it("scales a smaller grid up, so a 16-pixel glyph fills the box", () => {
		registerIcons({ small: { body: PATH, viewBox: "0 0 16 16" } });
		expect(transformOf(iconBody("small"))?.scale).toBe(ICON_GRID / 16);
	});

	/** The whole point of declaring the box rather than baking a transform: an off-origin or
	 * non-square box is where hand-computed arithmetic goes wrong. */
	it("centers a non-square box instead of stretching it", () => {
		registerIcons({ wide: { body: PATH, viewBox: "0 0 32 16" } });
		const t = transformOf(iconBody("wide"));
		expect(t?.scale).toBe(ICON_GRID / 32);
		expect(t?.tx).toBe(0);
		expect(t?.ty).toBe((ICON_GRID - 16 * (ICON_GRID / 32)) / 2);
	});

	it("takes a box that does not start at the origin", () => {
		registerIcons({ offset: { body: PATH, viewBox: "8 8 32 32" } });
		const t = transformOf(iconBody("offset"));
		const scale = ICON_GRID / 32;
		expect(t).toEqual({ tx: -8 * scale, ty: -8 * scale, scale });
	});

	it("declares a set's stroke weight once rather than per path", () => {
		registerIcons({ thin: { body: PATH } }, { strokeWidth: 1.6 });
		expect(iconBody("thin")).toContain('stroke-width="1.6"');
	});

	it("lets a glyph's own box beat the set default", () => {
		registerIcons({ odd: { body: PATH, viewBox: "0 0 48 48" } }, { viewBox: "0 0 32 32" });
		expect(transformOf(iconBody("odd"))?.scale).toBe(ICON_GRID / 48);
	});

	it("ignores a malformed box rather than emitting a broken transform", () => {
		registerIcons({ junk: { body: PATH, viewBox: "not a box" } });
		expect(iconBody("junk")).toBe(PATH);
	});

	it("still refuses an entry with no body", () => {
		registerIcons({ empty: { body: "" }, alsoEmpty: "" } as never);
		expect(iconBody("empty")).toBeUndefined();
		expect(iconBody("alsoEmpty")).toBeUndefined();
	});
});

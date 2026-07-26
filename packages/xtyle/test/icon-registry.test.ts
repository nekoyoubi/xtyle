import { afterEach, describe, expect, it } from "vitest";
import { ICONS, renderIcon } from "../src/icons.js";
import {
	ICON_SLOT,
	contributedIconNames,
	hasRosterIcon,
	iconBody,
	iconFillsFrom,
	registerIconFills,
	registerIcons,
	resetIcons,
	rosterIconNames,
} from "../src/icon-registry.js";

const MOD_GLYPH = '<path d="M4 4h16v16H4z" fill="currentColor"/>';
const REPLACEMENT = '<path d="M2 2h20v20H2z" fill="currentColor"/>';

afterEach(() => resetIcons());

describe("the icon roster", () => {
	it("resolves a built-in glyph with no contributions", () => {
		expect(iconBody("chevron-down")).toBe(ICONS["chevron-down"]);
		expect(hasRosterIcon("chevron-down")).toBe(true);
	});

	it("does not claim a name nothing provides", () => {
		expect(iconBody("nonesuch")).toBeUndefined();
		expect(hasRosterIcon("nonesuch")).toBe(false);
	});

	it("takes a new glyph a mod contributes", () => {
		registerIcons({ "mod-square": MOD_GLYPH });
		expect(iconBody("mod-square")).toBe(MOD_GLYPH);
		expect(contributedIconNames()).toEqual(["mod-square"]);
		expect(rosterIconNames()).toContain("mod-square");
	});

	it("lets a mod replace a built-in", () => {
		registerIcons({ check: REPLACEMENT });
		expect(iconBody("check")).toBe(REPLACEMENT);
		expect(iconBody("check")).not.toBe(ICONS.check);
	});

	it("gives the later contribution precedence", () => {
		registerIcons({ check: MOD_GLYPH });
		registerIcons({ check: REPLACEMENT });
		expect(iconBody("check")).toBe(REPLACEMENT);
	});

	it("counts a replaced built-in as built-in, not contributed", () => {
		registerIcons({ check: REPLACEMENT });
		expect(contributedIconNames()).toEqual([]);
	});

	it("restores the built-in set on reset", () => {
		registerIcons({ check: REPLACEMENT, "mod-square": MOD_GLYPH });
		resetIcons();
		expect(iconBody("check")).toBe(ICONS.check);
		expect(hasRosterIcon("mod-square")).toBe(false);
	});

	it("lists built-ins before contributions, without duplicating a replacement", () => {
		registerIcons({ check: REPLACEMENT, "mod-square": MOD_GLYPH });
		const names = rosterIconNames();
		expect(names.filter((n) => n === "check")).toHaveLength(1);
		expect(names.indexOf("mod-square")).toBeGreaterThan(names.indexOf("check"));
	});
});

describe("reading the slot off a mod manifest", () => {
	it("takes the glyph block a mod declares", () => {
		const manifest = { fills: { [ICON_SLOT]: [{ glyphs: { "mod-square": MOD_GLYPH } }] } };
		expect(iconFillsFrom(manifest)).toEqual([{ glyphs: { "mod-square": MOD_GLYPH } }]);
		expect(registerIconFills(manifest)).toBe(1);
		expect(iconBody("mod-square")).toBe(MOD_GLYPH);
	});

	it("reads a bare block as readily as an array of them", () => {
		const manifest = { fills: { [ICON_SLOT]: { glyphs: { solo: MOD_GLYPH } } } };
		expect(iconFillsFrom(manifest)).toHaveLength(1);
	});

	it("ignores a manifest that fills nothing", () => {
		expect(iconFillsFrom({})).toEqual([]);
		expect(iconFillsFrom(null)).toEqual([]);
		expect(registerIconFills({ fills: {} })).toBe(0);
	});

	it("refuses a block whose glyphs are not markup strings", () => {
		expect(iconFillsFrom({ fills: { [ICON_SLOT]: [{ glyphs: { bad: 42 } }] } })).toEqual([]);
		expect(iconFillsFrom({ fills: { [ICON_SLOT]: [{ notGlyphs: {} }] } })).toEqual([]);
	});
});

describe("rendering against the roster", () => {
	it("draws a contributed glyph when the body is handed in", () => {
		registerIcons({ "mod-square": MOD_GLYPH });
		expect(renderIcon("mod-square", { body: iconBody("mod-square") })).toContain(MOD_GLYPH);
	});

	it("draws the placeholder for a contributed name with no body passed", () => {
		registerIcons({ "mod-square": MOD_GLYPH });
		expect(renderIcon("mod-square")).not.toContain(MOD_GLYPH);
	});

	it("prefers a passed body over the built-in of the same name", () => {
		const svg = renderIcon("check", { body: REPLACEMENT });
		expect(svg).toContain(REPLACEMENT);
		expect(svg).not.toContain(ICONS.check);
	});
});

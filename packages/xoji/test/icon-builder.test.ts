import { describe, expect, it } from "vitest";
import {
	composeIcon,
	composeIconThemed,
	parseIconName,
	colorSlot,
	ICON_PRIMITIVES,
	ICON_PRIMITIVE_NAMES,
	hasPrimitive,
	resolvePrimitiveName,
	primitiveSince,
	primitiveTags,
	derive,
} from "../src/index.js";
import { xojiDefault } from "../src/batteries.js";

const register = derive(xojiDefault, {
	constraints: { "--bg-0": "#0b0d12", "--fg-0": "#e6e9ef", "--accent": "#6ea8fe" },
});

describe("icon-builder", () => {
	it("seeds heraldic fields, frames, ordinaries, and the functional glyphs as charges", () => {
		expect(hasPrimitive("shape-shield")).toBe(true);
		expect(hasPrimitive("shape-diamond")).toBe(true);
		expect(hasPrimitive("frame-ring")).toBe(true);
		expect(hasPrimitive("bar-row")).toBe(true);
		expect(hasPrimitive("bar-cross")).toBe(true);
		expect(hasPrimitive("symbol-check")).toBe(true);
		expect(hasPrimitive("symbol-star")).toBe(true);
		expect(hasPrimitive("symbol-crescent")).toBe(true);
		expect(hasPrimitive("symbol-bolt")).toBe(true);
		expect(hasPrimitive("symbol-nonexistent")).toBe(false);
		expect(ICON_PRIMITIVE_NAMES.length).toBeGreaterThan(30);
	});

	it("carries a divider and a triangle, reachable by keyword", () => {
		expect(hasPrimitive("divider-rule")).toBe(true);
		expect(hasPrimitive("shape-triangle")).toBe(true);
		expect(parseIconName("x--divider")!.composition.layers[0].primitive).toBe("divider-rule");
		expect(parseIconName("x--triangle-c3")!.composition.layers[0].primitive).toBe("shape-triangle");
		// a divider rotates to vertical through the same rotation flag any object takes
		expect(composeIcon(parseIconName("x--divider-r90")!.composition)).toContain("rotate(90 12 12)");
	});

	it("carries plain-language tags and a since version on every primitive, addressable by keyword", () => {
		// every primitive is tagged and versioned
		for (const name of ICON_PRIMITIVE_NAMES) {
			expect(ICON_PRIMITIVES[name].since).toBeTruthy();
			expect((ICON_PRIMITIVES[name].tags ?? []).length).toBeGreaterThan(0);
		}
		// a keyword resolves to its library name, then to that primitive's metadata
		expect(resolvePrimitiveName("star")).toBe("symbol-star");
		expect(resolvePrimitiveName("square1")).toBe("shape-square-1");
		expect(primitiveSince("star")).toBe("0.4.0");
		expect(primitiveTags("star")).toContain("favorite");
		// glyph tags describe meaning, not the glyph name — media controls are findable as "media"
		expect(primitiveTags("play")).toContain("media");
		expect(primitiveTags("close")).toContain("cancel");
		// an unknown name resolves to itself and yields no metadata
		expect(primitiveSince("symbol-nonexistent")).toBeUndefined();
		expect(primitiveTags("symbol-nonexistent")).toEqual([]);
	});

	it("resolves the five series slots to five distinct colors, so a sequential/sampled scheme no longer collapses", () => {
		const fillsFor = (scheme: "thermal" | "skittles" | "accents") => {
			const layers = [0, 1, 2, 3, 4].map((i) => ({ primitive: "shape-square", fill: `series:${i}` }));
			const svg = composeIconThemed({ layers }, { register, scheme });
			return [...svg.matchAll(/fill="(#[0-9a-fA-F]{6})"/g)].map((m) => m[1]);
		};
		// thermal (sequential) used to collapse to its endpoint; now it spreads across all five
		expect(new Set(fillsFor("thermal")).size).toBe(5);
		// skittles (sampled categorical) used to collapse to its last color; now five distinct
		expect(new Set(fillsFor("skittles")).size).toBe(5);
		// accents rounds out to five now that `--neutral` is its fifth color
		expect(new Set(fillsFor("accents")).size).toBe(5);
	});

	it("knocks a glyph out as a solid silhouette, the same as a bare primitive", () => {
		// a filled glyph (stop) draws with fill="currentColor"; the knockout mask seeds `color` so
		// that resolves to the solid mask color — without it the glyph only half-masks (shades) the art.
		const glyph = composeIcon({ layers: [{ primitive: "shape-shield" }, { primitive: "symbol-stop", knockout: true }] });
		expect(glyph).toContain("<mask");
		expect(glyph).toMatch(/<g [^>]*fill="#000" color="#000"[^>]*>/);
		// a bare primitive knockout keeps working (it inherits the group fill, no currentColor to seed)
		const bare = composeIcon({ layers: [{ primitive: "shape-shield" }, { primitive: "shape-square", knockout: true }] });
		expect(bare).toMatch(/<g [^>]*fill="#000" color="#000"[^>]*>/);
	});

	it("composes a valid layered svg back to front", () => {
		const svg = composeIcon({
			layers: [{ primitive: "shape-shield" }, { primitive: "symbol-check" }],
		});
		expect(svg.startsWith("<svg")).toBe(true);
		expect(svg).toContain('viewBox="0 0 24 24"');
		// field renders before charge (paints under it)
		expect(svg.indexOf(ICON_PRIMITIVES["shape-shield"].body)).toBeLessThan(
			svg.indexOf(ICON_PRIMITIVES["symbol-check"].body),
		);
	});

	it("is decorative by default and named when labelled", () => {
		expect(composeIcon({ layers: [{ primitive: "shape-circle" }] })).toContain('aria-hidden="true"');
		const named = composeIcon({ layers: [{ primitive: "shape-circle" }], label: "Guild crest" });
		expect(named).toContain('role="img"');
		expect(named).toContain('aria-label="Guild crest"');
		expect(named).toContain("<title>Guild crest</title>");
	});

	it("applies transforms about the grid center", () => {
		const svg = composeIcon({ layers: [{ primitive: "symbol-close", rotate: 45, scale: 0.5, x: 2 }] });
		expect(svg).toContain("translate(2 0)");
		expect(svg).toContain("rotate(45 12 12)");
		expect(svg).toContain("translate(12 12) scale(0.5) translate(-12 -12)");
	});

	it("resolves a literal color and currentColor as-is", () => {
		const svg = composeIcon({ layers: [{ primitive: "shape-circle", fill: "#ff0000" }] });
		expect(svg).toContain('fill="#ff0000"');
		expect(composeIcon({ layers: [{ primitive: "shape-circle" }] })).toContain('fill="currentColor"');
	});

	it("emits a css var for a token with no register, and bakes it with one", () => {
		const live = composeIcon({ layers: [{ primitive: "shape-circle", fill: "--accent" }] });
		expect(live).toContain('fill="var(--accent)"');

		const baked = composeIcon({ layers: [{ primitive: "shape-circle", fill: "--accent" }] }, { register });
		expect(baked).toContain(`fill="${register["--accent"]}"`);
		expect(baked).not.toContain("var(--accent)");
	});

	it("resolves a series slot off the register", () => {
		const svg = composeIcon(
			{ layers: [{ primitive: "shape-circle", fill: "series:0" }, { primitive: "symbol-dot", fill: "series:2" }] },
			{ register, scheme: "accents" },
		);
		// both slots resolve to concrete colors (not the raw spec, not currentColor)
		expect(svg).not.toContain("series:");
		expect(svg.match(/fill="#[0-9a-fA-F]{3,8}"/g)?.length).toBeGreaterThanOrEqual(2);
	});

	it("renders a visible placeholder for an unknown primitive", () => {
		const svg = composeIcon({ layers: [{ primitive: "no-such-primitive" }] });
		expect(svg).toContain("stroke-dasharray");
	});

	it("escapes a hostile label", () => {
		const svg = composeIcon({ layers: [{ primitive: "shape-circle" }], label: 'a" onload="x' });
		expect(svg).not.toContain('onload="x"');
		expect(svg).toContain("&quot;");
	});

	it("outlines a layer with a stroke and color", () => {
		const svg = composeIcon({ layers: [{ primitive: "shape-square", fill: "--bg-0", outline: { size: 2, color: "--accent" } }] });
		expect(svg).toContain('stroke="var(--accent)"');
		expect(svg).toContain('stroke-width="1.25"');
	});

	it("outlines a knockout as a stroke that resolves inherit to the icon color, not a fill or a shade", () => {
		// a bare primitive: the rim strokes (never fills) at the halved width, and does not force
		// `color="none"` — the bug that made an inherited outline color vanish.
		const bare = composeIcon({ layers: [{ primitive: "shape-shield" }, { primitive: "shape-square", knockout: true, outline: { size: 2, color: "currentColor" } }] });
		expect(bare).toMatch(/<g [^>]*fill="none" stroke="currentColor" stroke-width="1.25"[^>]*>/);
		expect(bare).not.toContain('color="none"');
		// a filled glyph rim outlines rather than fills: its own fill="currentColor" is normalized to none
		const glyph = composeIcon({ layers: [{ primitive: "shape-shield" }, { primitive: "symbol-stop", knockout: true, outline: { size: 1, color: "currentColor" } }] });
		expect(glyph).toContain('width="12" height="12" rx="2" fill="none"');
	});

	it("flips a layer via a negative scale about the center", () => {
		const svg = composeIcon({ layers: [{ primitive: "symbol-bolt", flipH: true }] });
		expect(svg).toContain("scale(-1 1)");
	});

	it("knocks a shape out through a mask and keeps a later layer on top", () => {
		const svg = composeIcon({
			layers: [
				{ primitive: "shape-square", fill: "#123456" },
				{ primitive: "symbol-dot", knockout: true, scale: 0.2 },
				{ primitive: "symbol-star", fill: "#abcdef" },
			],
		});
		expect(svg).toContain("<mask");
		expect(svg).toMatch(/mask="url\(#xk-[a-z0-9]+-0\)"/);
		// the knockout wraps only the field beneath it; the star paints after the masked group
		expect(svg.indexOf("</mask>")).toBeLessThan(svg.indexOf("#abcdef"));
		expect(svg.indexOf('mask="url(#xk')).toBeLessThan(svg.indexOf("#abcdef"));
	});

	it("clips the accumulated art to a shape on an inverted knockout (`-i-ko`)", () => {
		const svg = composeIcon({
			layers: [
				{ primitive: "shape-square", fill: "#123456" },
				{ primitive: "shape-circle", knockout: true, invert: true },
			],
		});
		// an inverted knockout flips the mask (black field, white shape), so only the shape survives
		expect(svg).toContain("<mask");
		expect(svg).toMatch(/mask="url\(#xk-[a-z0-9]+-\d+\)"/);
		expect(svg).toContain('<rect width="24" height="24" fill="#000"/>');
		expect(svg).toContain('fill="#fff"');
	});

	it("paints the complement of a shape on a plain invert (`-i`)", () => {
		const svg = composeIcon({ layers: [{ primitive: "shape-circle", fill: "#123456", invert: true }] });
		expect(svg).toMatch(/mask="url\(#xi-[a-z0-9]+-\d+\)"/);
		// a full-grid rect in the fill, masked so the shape is a hole in the field
		expect(svg).toContain('<rect width="24" height="24" fill="#123456"');
	});

	it("rounds a square through indexed variants, not a corner radius on the shape", () => {
		expect(composeIcon({ layers: [{ primitive: "shape-square" }] })).not.toContain("rx=");
		expect(composeIcon({ layers: [{ primitive: "shape-square-1" }] })).toContain('rx="2"');
		expect(composeIcon({ layers: [{ primitive: "shape-square-3" }] })).toContain('rx="6"');
	});

	it("keeps token fills live but bakes series slots in composeIconThemed", () => {
		const svg = composeIconThemed(
			{ layers: [{ primitive: "shape-square", fill: "--bg-0" }, { primitive: "symbol-star", fill: "series:0" }] },
			{ register, scheme: "accents" },
		);
		expect(svg).toContain('fill="var(--bg-0)"');
		expect(svg).not.toContain("series:0");
		expect(svg).toMatch(/fill="#[0-9a-fA-F]{3,8}"/);
	});

	it("maps the color ladder: 0 transparent, 1 fg, 2 bg, 3+ series", () => {
		expect(colorSlot(0)).toBe("transparent");
		expect(colorSlot(1)).toBe("--fg-0");
		expect(colorSlot(2)).toBe("--bg-0");
		expect(colorSlot(3)).toBe("series:0");
		expect(colorSlot(5)).toBe("series:2");
	});
});

describe("parseIconName", () => {
	it("returns null for a bare lookup name with no spec", () => {
		expect(parseIconName("search")).toBe(null);
		expect(parseIconName("chevron-right")).toBe(null);
	});

	it("parses label and objects, ignoring the now-empty `---` finish", () => {
		const parsed = parseIconName("dice-3--square-c3--dot-p7-s10--dot-s10--dot-p3-s10---rl");
		expect(parsed).not.toBe(null);
		expect(parsed?.label).toBe("dice-3");
		expect(parsed?.composition.label).toBe("dice 3");
		expect(parsed?.composition.layers).toHaveLength(4);
		// the face is the first scheme color; keyword resolves to the library name
		expect(parsed?.composition.layers[0]).toMatchObject({ primitive: "shape-square", fill: "series:0" });
		// a pip sized to 10% and centered by default (p5)
		expect(parsed?.composition.layers[2]).toMatchObject({ primitive: "shape-circle", scale: 0.1 });
		expect(parsed?.composition.layers[2].x ?? 0).toBe(0);
	});

	it("reads a `d…` drop shadow from the `---` finish and ignores lock flags there", () => {
		const shadow = parseIconName("crest--shield-c3---d2p8s3t80")?.composition.dropShadow;
		expect(shadow).toBeDefined();
		expect(shadow?.color).toBe("--bg-0");
		expect(shadow?.dx).toBeCloseTo(0);
		expect(shadow?.dy).toBeCloseTo(3.3);
		expect(shadow?.blur).toBeCloseTo(2);
		// lock flags in the finish are authoring metadata: the renderer never derives a shadow from them
		expect(parseIconName("crest--shield-c3---l1*")?.composition.dropShadow).toBeUndefined();
		// a shadow and locks coexist in one finish; each reader skips the other's tokens
		expect(parseIconName("crest--shield-c3---d2p8s3t80-l1*")?.composition.dropShadow).toBeDefined();
	});

	it("composes a drop shadow into an SVG filter and lets the mark overflow its box", () => {
		const svg = composeIcon(parseIconName("crest--shield-c3---d1p8s3t80")!.composition);
		expect(svg).toContain("<filter");
		expect(svg).toContain("feDropShadow");
		expect(svg).toContain("overflow:visible");
		// no finish → no filter, no overflow
		const plain = composeIcon(parseIconName("crest--shield-c3")!.composition);
		expect(plain).not.toContain("feDropShadow");
		expect(plain).not.toContain("overflow:visible");
	});

	it("bakes a series shadow color in composeIconThemed", () => {
		const composition = parseIconName("crest--shield-c3---d3p8s3t80")!.composition;
		const svg = composeIconThemed(composition, { register, scheme: "accents" });
		// d3 is series slot 0 → the shadow flood-color bakes to a concrete color, not the `series:0` spec
		expect(svg).toContain("feDropShadow");
		expect(svg).not.toContain("series:0");
	});

	it("places p on a phone-keypad grid: 1 top-left, 5 center, 9 bottom-right", () => {
		const bl = parseObjectLayer("dot-p7");
		expect(bl.x).toBeCloseTo(-8);
		expect(bl.y).toBeCloseTo(8);
		const tr = parseObjectLayer("dot-p3");
		expect(tr.x).toBeCloseTo(8);
		expect(tr.y).toBeCloseTo(-8);
		const center = parseObjectLayer("dot-p5");
		expect(center.x ?? 0).toBe(0);
		expect(center.y ?? 0).toBe(0);
	});

	it("reads flags in any order and handles a signed offset", () => {
		const a = parseObjectLayer("square-s80-ko-r45");
		const b = parseObjectLayer("square-r45-ko-s80");
		expect(a).toEqual(b);
		expect(a).toMatchObject({ scale: 0.8, knockout: true, rotate: 45 });
		const offset = parseObjectLayer("dot-p5-x-25");
		expect(offset.x).toBeCloseTo(-6);
	});

	it("reaches a single-token functional glyph as a charge by its bare name", () => {
		expect(parseObjectLayer("check").primitive).toBe("symbol-check");
		expect(parseObjectLayer("search").primitive).toBe("symbol-search");
		expect(parseObjectLayer("warning-s50").primitive).toBe("symbol-warning");
		// `dot` stays a field (a sizeable pip), not the tiny glyph
		expect(parseObjectLayer("dot").primitive).toBe("shape-circle");
		// a real check badge composes onto a known primitive, not the missing-box placeholder
		const svg = composeIcon(parseIconName("badge--circle-c4--check-s55-c1")!.composition);
		expect(svg).not.toContain("stroke-dasharray");
	});

	it("parses the compound outline token without eating the standalone fill", () => {
		const layer = parseObjectLayer("square-c3-o1c2");
		expect(layer.fill).toBe("series:0");
		expect(layer.outline).toEqual({ size: 1, color: "--bg-0" });
	});

	it("reads flips and opacity", () => {
		const layer = parseObjectLayer("bolt-fh-fv-a50");
		expect(layer).toMatchObject({ flipH: true, flipV: true, opacity: 0.5 });
	});

	it("parses an indexed primitive variant and the invert flag", () => {
		expect(parseObjectLayer("square1").primitive).toBe("shape-square-1");
		expect(parseObjectLayer("square3-c3").primitive).toBe("shape-square-3");
		expect(parseObjectLayer("circle-i-ko")).toMatchObject({ primitive: "shape-circle", invert: true, knockout: true });
		expect(parseObjectLayer("heart-i").invert).toBe(true);
	});

	it("stays robust against malformed and hostile specs (no throw, valid svg, no NaN)", () => {
		const hostile = [
			"x--",
			"--",
			"x---rl",
			"x--square",
			"x--frobnicate-c3",
			"x--dot-p0-s20",
			"x--dot-p10-s20",
			"x--dot-p99",
			"x--square-s0",
			"x--square-s500",
			"x--square-s-50",
			"x--dot-x-50-y-100",
			"x--star-c99",
			"x--square-o5c3",
			"x--square-a200",
			"x--bolt-r720",
			"x--bolt-r-45",
			"x--bolt-fh-fv",
			"x--square-c3--square-s60-ko--square-s30-ko",
			"x--square-s80-ko-o2c3",
		];
		for (const spec of hostile) {
			const parsed = parseIconName(spec);
			expect(parsed, spec).not.toBe(null);
			const svg = composeIcon(parsed!.composition, { register, scheme: "accents" });
			expect(svg.startsWith("<svg"), spec).toBe(true);
			expect(/NaN|undefined|Infinity/.test(svg), spec).toBe(false);
			expect(/fill=""|stroke=""|="var\(undefined\)"/.test(svg), spec).toBe(false);
			// balanced groups (knockout nests masked groups; a leak would corrupt the tree)
			expect((svg.match(/<g[\s>]/g) ?? []).length, spec).toBe((svg.match(/<\/g>/g) ?? []).length);
		}
	});

	it("round-trips a parsed spec through the renderer", () => {
		const parsed = parseIconName("badge--circle-c4--star-s55-c1");
		const svg = composeIcon(parsed!.composition);
		expect(svg.startsWith("<svg")).toBe(true);
		expect(svg).toContain('role="img"');
	});
});

function parseObjectLayer(objectSpec: string) {
	const parsed = parseIconName(`x--${objectSpec}`);
	return parsed!.composition.layers[0];
}

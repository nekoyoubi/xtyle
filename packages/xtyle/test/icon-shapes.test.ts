import { describe, expect, it } from "vitest";
import { iconShapeNames, registerIconShapes, resolveIconPoints } from "../src/icon-shapes.js";
import { composeIcon, parseIconName } from "../src/icon-builder.js";

const draw = (name: string): string => {
	const parsed = parseIconName(name);
	return parsed ? composeIcon(parsed.composition) : "";
};

const pointsOf = (svg: string): { tag: string; points: string } | null => {
	const hit = /<(polygon|polyline)\b[^>]*points="([^"]*)"/.exec(svg);
	return hit ? { tag: hit[1] as string, points: hit[2] as string } : null;
};

describe("resolveIconPoints", () => {
	it("reads a comma run and a space run the same way", () => {
		expect(resolveIconPoints("0,0,100,50,0,100")).toEqual([0, 0, 100, 50, 0, 100]);
		expect(resolveIconPoints("0,0 100,50 0,100")).toEqual([0, 0, 100, 50, 0, 100]);
	});

	it("refuses a run of fewer than three pairs", () => {
		expect(resolveIconPoints("0,0,100,50")).toBeNull();
		expect(resolveIconPoints("")).toBeNull();
	});

	it("refuses a run with a coordinate left dangling, at any length", () => {
		expect(resolveIconPoints("0,0,100,50,0")).toBeNull();
		expect(resolveIconPoints("0,0,100,50,0,100,50")).toBeNull();
		expect(resolveIconPoints("0,0,100,50,0,100,50,25,60")).toBeNull();
	});

	it("refuses a run carrying anything that is not a number", () => {
		expect(resolveIconPoints("0,0,100,fifty,0,100")).toBeNull();
	});

	it("resolves a registered name and returns null for one nobody registered", () => {
		expect(resolveIconPoints("arrow")).not.toBeNull();
		expect(resolveIconPoints("nosuchshape")).toBeNull();
	});

	it("takes a contributed shape by name, last-wins", () => {
		registerIconShapes({ blade: "0,0 100,40 40,100" });
		expect(resolveIconPoints("blade")).toEqual([0, 0, 100, 40, 40, 100]);
		expect(iconShapeNames()).toContain("blade");

		registerIconShapes({ blade: "0,0 100,0 50,100" });
		expect(resolveIconPoints("blade")).toEqual([0, 0, 100, 0, 50, 100]);
	});

	it("refuses a name carrying a hyphen, which the grammar reads as a flag boundary", () => {
		registerIconShapes({ "half-moon": "0,0 100,50 0,100" });
		expect(iconShapeNames()).not.toContain("half-moon");
	});
});

describe("poly in an icon name", () => {
	it("maps a 0-100 run onto the 24-unit grid", () => {
		expect(pointsOf(draw("flag--poly-pts0,0,100,50,0,100"))).toEqual({
			tag: "polygon",
			points: "0,0 24,12 0,24",
		});
	});

	it("closes and fills a poly, and leaves a polyline open and stroked", () => {
		const filled = draw("a--poly-pts0,0,100,50,0,100");
		const open = draw("b--polyline-pts0,0,100,50,0,100");
		expect(pointsOf(filled)?.tag).toBe("polygon");
		expect(filled).toContain('fill="currentColor"');
		expect(pointsOf(open)?.tag).toBe("polyline");
		expect(open).toContain('fill="none"');
		expect(open).toContain("stroke");
	});

	it("draws a registered name", () => {
		expect(pointsOf(draw("arrowmark--poly-ptsarrow"))?.points).toBe("0,4.8 14.4,4.8 14.4,0 24,12 14.4,24 14.4,19.2 0,19.2");
	});

	it("rides the same flags every other primitive does", () => {
		const svg = draw("t--poly-pts0,0,100,50,0,100-s60-r90");
		expect(svg).toContain("scale(0.6)");
		expect(svg).toContain("rotate(90");
	});

	it("works as a knockout, so a run can carve the art beneath it", () => {
		expect(draw("t--circle--poly-pts0,0,100,50,0,100-ko")).toContain("<mask");
	});

	it("draws the placeholder for a run too short to be a shape, rather than a malformed one", () => {
		expect(pointsOf(draw("bad--poly-pts0,0,100,50"))).toBeNull();
	});

	it("draws the placeholder for a name nobody registered", () => {
		expect(pointsOf(draw("bogus--poly-ptsnope"))).toBeNull();
	});
});

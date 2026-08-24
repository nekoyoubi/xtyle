import { afterEach, describe, expect, it, vi } from "vitest";
import {
	ICON_PRIMITIVE_NAMES,
	composeIcon,
	hasPrimitive,
	iconComposition,
	iconPrimitive,
	iconPrimitiveNames,
	iconPrimitiveRoster,
	primitiveDescription,
	primitiveSince,
	primitiveTags,
	registerIconPrimitives,
	resetIconPrimitives,
	resolvePrimitiveName,
} from "../src/icon-builder.js";
import { registerIconShapes, resetIconShapes } from "../src/icon-shapes.js";

afterEach(() => {
	resetIconPrimitives();
	resetIconShapes();
	vi.restoreAllMocks();
});

const svg = (name: string) => composeIcon(iconComposition(name));

describe("a point run becomes a primitive", () => {
	it("mints one from a coordinate run, reachable by name in a composition", () => {
		registerIconPrimitives({ blade: { pts: "0,0 100,40 40,100" } });
		expect(hasPrimitive("blade")).toBe(true);
		expect(svg("mark--blade")).toContain("<polygon");
	});

	it("takes the name of a list registered through the point-list registry", () => {
		registerIconShapes({ blade: "0,0 100,40 40,100" });
		registerIconPrimitives({ blade: { pts: "blade" } });
		expect(iconPrimitive("blade")?.body).toBe(iconPrimitive("blade")?.body);
		expect(svg("mark--blade")).toContain("<polygon");
	});

	it("strokes an open run rather than closing it", () => {
		registerIconPrimitives({ sig: { pts: "10,70 30,30 50,60 90,20", open: true } });
		const body = iconPrimitive("sig")?.body ?? "";
		expect(body).toContain("<polyline");
		expect(body).not.toContain("<polygon");
	});

	it("takes a raw SVG body for a shape no point run describes", () => {
		registerIconPrimitives({ ring: { body: '<circle cx="12" cy="12" r="9" fill="none"/>' } });
		expect(svg("mark--ring")).toContain('r="9"');
	});

	it("saves the poly-pts prefix the point list alone still costs", () => {
		registerIconShapes({ blade: "0,0 100,40 40,100" });
		registerIconPrimitives({ blade: { pts: "blade" } });
		expect(svg("mark--blade")).toBe(svg("mark--poly-ptsblade"));
	});
});

describe("registration is last-wins, and outranks a keyword", () => {
	it("replaces the built-in a grammar keyword used to reach", () => {
		const before = svg("mark--heart");
		registerIconPrimitives({ heart: { pts: "0,0 100,0 50,100" } });
		expect(resolvePrimitiveName("heart")).toBe("heart");
		expect(svg("mark--heart")).not.toBe(before);
		resetIconPrimitives();
		expect(resolvePrimitiveName("heart")).toBe("symbol-heart");
		expect(svg("mark--heart")).toBe(before);
	});

	it("replaces a contributed primitive on the same name", () => {
		registerIconPrimitives({ blade: { pts: "0,0 100,40 40,100" } });
		const first = iconPrimitive("blade")?.body;
		registerIconPrimitives({ blade: { pts: "0,0 100,0 50,100" } });
		expect(iconPrimitive("blade")?.body).not.toBe(first);
	});
});

describe("a definition that describes nothing drawable is refused, loudly", () => {
	it("refuses a name the grammar could not separate from a flag", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		registerIconPrimitives({ "half-moon": { pts: "0,0 100,50 0,100" } });
		expect(hasPrimitive("half-moon")).toBe(false);
		expect(warn).toHaveBeenCalled();
	});

	it("refuses a run of fewer than three pairs, and an unregistered list name", () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		registerIconPrimitives({ thin: { pts: "0,0 100,100" }, ghost: { pts: "nobodyregisteredthis" } });
		expect(hasPrimitive("thin")).toBe(false);
		expect(hasPrimitive("ghost")).toBe(false);
	});

	it("refuses a definition carrying neither a run nor a body", () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		registerIconPrimitives({ empty: { tags: ["nothing"] }, blank: { body: "  " } });
		expect(hasPrimitive("empty")).toBe(false);
		expect(hasPrimitive("blank")).toBe(false);
	});
});

describe("a contributed primitive is a first-class member of the roster", () => {
	it("carries its own tags, description and since through the lookups", () => {
		registerIconPrimitives({ blade: { pts: "0,0 100,40 40,100", tags: ["blade", "shard"], description: "a tapered blade", since: "9.9.9" } });
		expect(primitiveTags("blade")).toEqual(["blade", "shard"]);
		expect(primitiveDescription("blade")).toBe("a tapered blade");
		expect(primitiveSince("blade")).toBe("9.9.9");
	});

	it("shows up in the live roster the MCP surface reads", () => {
		registerIconPrimitives({ blade: { pts: "0,0 100,40 40,100" } });
		expect(iconPrimitiveNames()).toContain("blade");
		expect(iconPrimitiveRoster().some((entry) => entry.library === "blade")).toBe(true);
	});

	it("leaves the shipped-primitive count alone, so a site figure means what xtyle ships", () => {
		const shipped = ICON_PRIMITIVE_NAMES.length;
		registerIconPrimitives({ blade: { pts: "0,0 100,40 40,100" } });
		expect(ICON_PRIMITIVE_NAMES.length).toBe(shipped);
		expect(iconPrimitiveNames().length).toBe(shipped + 1);
	});
});

// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import "../src/elements/nine-patch.js";
import {
	ninePatchSource,
	ninePatchFrameStyle,
	ninePatchPieceStyle,
	ninePatchTracks,
	ninePatchNaturalSize,
	ninePatchCrops,
	ninePatchTintedRegionStyle,
} from "../src/markup/nine-patch.js";

afterEach(() => {
	document.body.innerHTML = "";
});

function root(el: HTMLElement): ParentNode {
	return el.shadowRoot ?? el;
}

function mount(attrs: Record<string, string> = {}, children = ""): HTMLElement {
	const el = document.createElement("xtyle-nine-patch");
	for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
	el.innerHTML = children;
	document.body.appendChild(el);
	return el;
}

/** The fill paints through the sandbox, so wait for the frame before asserting. */
async function painted(el: HTMLElement): Promise<HTMLElement> {
	for (let i = 0; i < 240; i++) {
		if (root(el).querySelector('[part="frame"]')) return el;
		await new Promise((r) => setTimeout(r, 25));
	}
	throw new Error("nine patch never painted");
}

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48"/></svg>';
const frameStyle = (el: HTMLElement): string => root(el).querySelector('[part="frame"]')?.getAttribute("style") ?? "";

describe("nine-patch artwork sources", () => {
	it("passes a url through", () => {
		expect(ninePatchSource("/frame.png")).toBe('url("/frame.png")');
	});

	it("passes a data uri through untouched", () => {
		const uri = "data:image/png;base64,iVBORw0KGgo=";
		expect(ninePatchSource(uri)).toBe(`url("${uri}")`);
	});

	it("encodes raw svg markup, so artwork can be generated rather than filed", () => {
		const out = ninePatchSource(SVG) ?? "";
		expect(out).toContain("data:image/svg+xml,");
		expect(out).toContain(encodeURIComponent("<svg"));
	});

	it("refuses markup that is not svg rather than encoding an unknown blob", () => {
		expect(ninePatchSource("<script>alert(1)</script>")).toBeNull();
	});

	it("escapes a quote in a url instead of breaking out of the css string", () => {
		expect(ninePatchSource('/a".png')).toBe('url("/a\\".png")');
	});

	it("treats an empty source as nothing to draw", () => {
		expect(ninePatchSource("")).toBeNull();
		expect(ninePatchSource(null)).toBeNull();
		expect(ninePatchFrameStyle({ source: null, slice: "1", width: "auto", outset: "0", repeat: "stretch", fill: false })).toBeNull();
	});
});

describe("xtyle-nine-patch", () => {

	it("draws a sliced patch as one frame node, with no override layer it does not need", async () => {
		const el = mount({ src: "/a.png", slice: "16" });
		await painted(el);
		expect(root(el).querySelectorAll("[data-region]")).toHaveLength(0);
		expect(root(el).querySelector(".xtyle-nine-patch__frame")).not.toBeNull();
	});

	it("layers overrides over the sliced base rather than replacing the whole frame", async () => {
		const el = mount({ src: "/base.png", slice: "16", pieces: JSON.stringify({ top: "/banner.svg" }) });
		await painted(el);
		expect(root(el).querySelector(".xtyle-nine-patch__frame")).not.toBeNull();
		expect(root(el).querySelectorAll("[data-region]")).toHaveLength(9);
		expect(root(el).querySelector('[data-region="top"]')?.hasAttribute("style")).toBe(true);
		expect(root(el).querySelector('[data-region="bottom"]')?.hasAttribute("style")).toBe(false);
	});

	it("leaves the base showing through every region no override named", async () => {
		const el = mount({ src: "/base.png", slice: "16", pieces: JSON.stringify({ "top-left": "/gem.svg" }) });
		await painted(el);
		const styled = [...root(el).querySelectorAll("[data-region]")].filter((p) => p.hasAttribute("style"));
		expect(styled.map((p) => p.getAttribute("data-region"))).toEqual(["top-left"]);
	});

	it("still works with overrides alone, when there is no base to slice", async () => {
		const el = mount({ slice: "16", pieces: JSON.stringify({ center: "/c.png" }) });
		await painted(el);
		expect(root(el).querySelector(".xtyle-nine-patch__frame")).toBeNull();
		expect(root(el).querySelector('[data-region="center"]')?.hasAttribute("style")).toBe(true);
	});

	it("lets one segment carry a different token from the frame it sits on", async () => {
		const el = mount({
			src: "/base.png",
			slice: "16",
			tint: "var(--fg-2)",
			pieces: JSON.stringify({ "top-left": "/gem.svg" }),
			tints: JSON.stringify({ "top-left": "var(--accent)" }),
		});
		await painted(el);
		const corner = root(el).querySelector('[data-region="top-left"]')?.getAttribute("style") ?? "";
		expect(corner).toContain("background: var(--accent)");
	});

	it("adds the fill keyword only when the centre should paint", async () => {
		const base = { source: 'url("/a.png")', slice: "10", width: "auto", outset: "0", repeat: "stretch" };
		expect(ninePatchFrameStyle({ ...base, fill: false })).toContain("border-image-slice: 10;");
		expect(ninePatchFrameStyle({ ...base, fill: true })).toContain("border-image-slice: 10 fill;");
	});

	it("masks a colour instead of painting the art when tinted", () => {
		const style = ninePatchFrameStyle({
			source: 'url("/a.png")', slice: "10", width: "auto", outset: "0", repeat: "stretch", fill: false,
			tint: "var(--accent)",
		}) ?? "";
		expect(style).toContain("background: var(--accent)");
		expect(style).toContain("mask-border-source:");
		expect(style).toContain("-webkit-mask-box-image-source:");
		expect(style).toContain("border-image-source: none");
	});

	it("keeps the frame decorative and out of the pointer's way", async () => {
		const el = mount({ src: "/a.png" });
		await painted(el);
		const frame = root(el).querySelector('[part="frame"]');
		expect(frame?.getAttribute("aria-hidden")).toBe("true");
	});

	it("holds the slotted content in its own layer above the art", async () => {
		const el = mount({ src: "/a.png" }, "<p id='inner'>Content</p>");
		await painted(el);
		const content = root(el).querySelector('[part="content"]');
		expect(content).not.toBeNull();
		expect(el.querySelector("#inner")?.textContent).toBe("Content");
	});

	it("renders nine addressable nodes when given nine sources", async () => {
		const el = mount({
			slice: "16",
			pieces: JSON.stringify({
				"top-left": "/tl.png",
				top: "/t.png",
				"top-right": "/tr.png",
				left: "/l.png",
				center: "/c.png",
				right: "/r.png",
				"bottom-left": "/bl.png",
				bottom: "/b.png",
				"bottom-right": "/br.png",
			}),
		});
		await painted(el);
		const pieces = [...root(el).querySelectorAll("[data-region]")];
		expect(pieces).toHaveLength(9);
		expect(pieces.map((p) => p.getAttribute("data-region"))).toEqual([
			"top-left", "top", "top-right", "left", "center", "right", "bottom-left", "bottom", "bottom-right",
		]);
	});

	it("lets each piece tile only along the axis it runs", () => {
		const styleOf = (region: string) =>
			ninePatchPieceStyle({ region: region as never, source: 'url("/p.png")', repeat: "repeat" }) ?? "";
		expect(styleOf("top-left")).toContain("background-repeat: no-repeat");
		expect(styleOf("top")).toContain("background-repeat: repeat no-repeat");
		expect(styleOf("left")).toContain("background-repeat: no-repeat repeat");
		expect(styleOf("center")).toContain("background-repeat: repeat;");
	});

	it("gives a unitless slice its pixels, which a grid track requires and border-image does not", () => {
		expect(ninePatchTracks("16")).toContain("16px 1fr 16px");
		expect(ninePatchTracks("2rem")).toContain("2rem 1fr 2rem");
		expect(ninePatchTracks("25%")).toContain("25% 1fr 25%");
	});

	it("lays the pieces on tracks the slice sizes", () => {
		expect(ninePatchTracks("20")).toBe(
			"grid-template-columns: 20px 1fr 20px; grid-template-rows: 20px 1fr 20px;",
		);
		expect(ninePatchTracks("12 30")).toBe(
			"grid-template-columns: 30px 1fr 30px; grid-template-rows: 12px 1fr 12px;",
		);
	});

	it("tints a pieced patch the same way it tints a sliced one", () => {
		const style = ninePatchPieceStyle({
			region: "center", source: 'url("/c.png")', repeat: "stretch", tint: "var(--accent)",
		}) ?? "";
		expect(style).toContain("background: var(--accent)");
		expect(style).toContain("mask-image:");
	});
});

describe("nine-patch tinted draw", () => {
	const ART = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#000"/></svg>`;

	it("reads the artwork's own size off markup and off a viewBox", () => {
		expect(ninePatchNaturalSize(ART)).toEqual({ width: 96, height: 96 });
		expect(ninePatchNaturalSize(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 24"></svg>`)).toEqual({
			width: 48,
			height: 24,
		});
		expect(ninePatchNaturalSize(`data:image/svg+xml,${encodeURIComponent(ART)}`)).toEqual({ width: 96, height: 96 });
	});

	it("has no size to offer for a bitmap behind a url", () => {
		expect(ninePatchNaturalSize("/frames/parchment.png")).toBeNull();
		expect(ninePatchNaturalSize(null)).toBeNull();
	});

	it("cuts nine regions, each a viewBox over the source", () => {
		const crops = ninePatchCrops(ART, "32", "repeat");
		expect(crops).not.toBeNull();
		expect(Object.keys(crops!)).toHaveLength(9);
		const read = (region: string) => decodeURIComponent(crops![region as "top"]!);
		expect(read("top-left")).toContain('viewBox="0 0 32 32"');
		expect(read("top")).toContain('viewBox="32 0 32 32"');
		expect(read("bottom-right")).toContain('viewBox="64 64 32 32"');
		expect(read("center")).toContain('viewBox="32 32 32 32"');
	});

	it("keeps only the centre when the slice is zero, so a naive scale still draws", () => {
		const crops = ninePatchCrops(ART, "0", "stretch");
		expect(Object.keys(crops!)).toEqual(["center"]);
		expect(decodeURIComponent(crops!.center!)).toContain('viewBox="0 0 96 96"');
	});

	it("only frees the aspect ratio where a region is actually stretched", () => {
		const wrapper = (repeat: string) => /<svg[^>]*>/.exec(decodeURIComponent(ninePatchCrops(ART, "32", repeat)!.top!))![0];
		expect(wrapper("stretch")).toContain('preserveAspectRatio="none"');
		expect(wrapper("repeat")).not.toContain('preserveAspectRatio="none"');
	});

	it("declines to cut what it cannot measure or cannot halve", () => {
		expect(ninePatchCrops("/frames/parchment.png", "32", "repeat")).toBeNull();
		expect(ninePatchCrops(ART, "64", "repeat")).toBeNull();
	});

	it("masks the tint per region rather than reaching for mask-border", () => {
		const style = ninePatchTintedRegionStyle("top", "repeat", "var(--accent)");
		expect(style).toContain("background: var(--accent)");
		expect(style).toContain("mask-image: var(--xtyle-nine-patch-crop-top)");
		expect(style).toContain("-webkit-mask-image:");
		expect(style).not.toContain("mask-border");
	});

	it("draws a tinted patch as nine cells, not one masked frame", () => {
		const el = mount({ src: ART, slice: "32", tint: "var(--accent)", fill: "" });
		const grid = root(el).querySelector(".xtyle-nine-patch__pieces");
		expect(grid).not.toBeNull();
		expect(grid!.children).toHaveLength(9);
		expect(root(el).querySelector(".xtyle-nine-patch__frame--tinted:not(.xtyle-nine-patch__pieces)")).toBeNull();
	});

	it("leaves an untinted patch on the border-image draw", () => {
		const el = mount({ src: ART, slice: "32" });
		const frame = root(el).querySelector(".xtyle-nine-patch__frame");
		expect(frame?.getAttribute("style") ?? "").toContain("border-image-source");
	});
});

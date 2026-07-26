/**
 * Nine-patch markup shared by the element and the SSR bindings, so both resolve artwork and assemble
 * the frame identically.
 *
 * The artwork never travels inside the fill's CSS. A fill is sandboxed and its `style` is sanitized
 * through a `css` sink, which strips `url()` — correctly, since a sandboxed mod naming arbitrary URLs
 * is exactly what that sink exists to prevent. So the element sets the resolved source on a custom
 * property it owns and the fill only ever references that property by name.
 */

/** The custom property carrying the sliced artwork. */
export const NINE_PATCH_SRC_VAR = "--xtyle-nine-patch-src";

/** The custom property carrying one region's own artwork. */
export function ninePatchRegionVar(region: string): string {
	return `--xtyle-nine-patch-${region}`;
}

/** The custom property carrying one region cut out of the base artwork, for the tinted draw. */
export function ninePatchCropVar(region: string): string {
	return `--xtyle-nine-patch-crop-${region}`;
}

export const ninePatchHostCss = `:host { display: block; position: relative; }`;

/** The nine regions, in reading order. A pieced patch names its artwork by these. */
export const NINE_PATCH_REGIONS = [
	"top-left",
	"top",
	"top-right",
	"left",
	"center",
	"right",
	"bottom-left",
	"bottom",
	"bottom-right",
] as const;

export type NinePatchRegion = (typeof NINE_PATCH_REGIONS)[number];

export interface NinePatchPieceOptions {
	region: NinePatchRegion;
	source: string | null;
	repeat: string;
	tint?: string | null;
}

export interface NinePatchFrameOptions {
	source: string | null;
	slice: string;
	width: string;
	outset: string;
	repeat: string;
	fill: boolean;
	tint?: string | null;
}

/** A CSS `url()` argument, with the quote and backslash escaping that string form requires. */
function cssUrl(value: string): string {
	return `url("${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}")`;
}

/**
 * Resolve the three shapes `src` accepts into something CSS can load: a URL and a `data:` URI pass
 * through, and raw SVG markup is encoded into one. Encoding rather than requiring the author to do it
 * is what lets artwork be generated — an algorithm can hand over a string and never touch base64.
 */
export function ninePatchSource(src: string | null | undefined): string | null {
	const href = resolvedHref(src);
	return href ? cssUrl(href) : null;
}

/** The same three shapes `ninePatchSource` resolves, short of the `url()` wrap — for a caller that
 * needs the plain URL or `data:` URI itself, such as an `<image>` reference cut out of it. */
function resolvedHref(src: string | null | undefined): string | null {
	const value = src?.trim();
	if (!value) return null;
	if (!value.startsWith("<")) return value;
	const svg = value.startsWith("<svg") || value.includes("<svg");
	if (!svg) return null;
	return `data:image/svg+xml,${encodeURIComponent(value)}`;
}

/**
 * The frame layer's inline CSS.
 *
 * Untinted it is a plain `border-image`. Tinted, the same slicing drives `mask-border` and the colour
 * comes from a background, so one monochrome patch takes whatever token it is pointed at. The
 * `-webkit-` spelling rides along because the unprefixed property is still not universal, and both
 * are emitted rather than sniffed so the browser takes whichever it understands.
 */
export function ninePatchFrameStyle(opts: NinePatchFrameOptions): string | null {
	if (!opts.source) return null;
	const slice = `${opts.slice}${opts.fill ? " fill" : ""}`;
	const shared = [
		`border-image-source: ${opts.source}`,
		`border-image-slice: ${slice}`,
		`border-image-width: ${opts.width}`,
		`border-image-outset: ${opts.outset}`,
		`border-image-repeat: ${opts.repeat}`,
	];
	if (!opts.tint) return `${shared.join("; ")};`;
	return [
		`background: ${opts.tint}`,
		`border-image-source: none`,
		`mask-border-source: ${opts.source}`,
		`mask-border-slice: ${slice}`,
		`mask-border-width: ${opts.width}`,
		`mask-border-outset: ${opts.outset}`,
		`mask-border-repeat: ${opts.repeat}`,
		`-webkit-mask-box-image-source: ${opts.source}`,
		`-webkit-mask-box-image-slice: ${slice}`,
		`-webkit-mask-box-image-width: ${opts.width}`,
		`-webkit-mask-box-image-outset: ${opts.outset}`,
		`-webkit-mask-box-image-repeat: ${opts.repeat}`,
	].join("; ") + ";";
}

/** Which way a region is free to tile: the top and bottom run horizontally, the sides vertically,
 * the centre both ways, and a corner never tiles at all. */
function repeatFor(region: NinePatchRegion, repeat: string): string {
	if (repeat === "stretch") return "no-repeat";
	const mode = repeat === "round" ? "round" : repeat === "space" ? "space" : "repeat";
	if (region === "center") return mode;
	if (region === "top" || region === "bottom") return `${mode} no-repeat`;
	if (region === "left" || region === "right") return `no-repeat ${mode}`;
	return "no-repeat";
}

/** A corner is drawn at its natural size; everything else covers its track. */
function sizeFor(region: NinePatchRegion, repeat: string): string {
	const corner = region.includes("-");
	if (corner) return "100% 100%";
	if (repeat === "stretch") return "100% 100%";
	return "auto";
}

/** The mask declarations a tinted region shares with a tinted piece: a flat colour behind, the
 * artwork as the mask that cuts it to shape. */
function maskedStyle(tint: string, source: string, repeat: string, size: string): string {
	return [
		`background: ${tint}`,
		`mask-image: ${source}`,
		`mask-repeat: ${repeat}`,
		`mask-size: ${size}`,
		`-webkit-mask-image: ${source}`,
		`-webkit-mask-repeat: ${repeat}`,
		`-webkit-mask-size: ${size}`,
	].join("; ") + ";";
}

/** One region's inline CSS. Tinted, the piece masks a colour the same way the sliced frame does. */
export function ninePatchPieceStyle(opts: NinePatchPieceOptions): string | null {
	if (!opts.source) return null;
	const repeat = repeatFor(opts.region, opts.repeat);
	const size = sizeFor(opts.region, opts.repeat);
	if (!opts.tint) {
		return `background-image: ${opts.source}; background-repeat: ${repeat}; background-size: ${size};`;
	}
	return maskedStyle(opts.tint, opts.source, repeat, size);
}

/**
 * One region of a tinted patch: the colour is a plain background and the region's own cut of the
 * artwork masks it, so the shape comes from the drawing and the colour from the token — through
 * properties every engine implements, with no script and nothing to recompute on resize.
 */
export function ninePatchTintedRegionStyle(region: NinePatchRegion, repeat: string, tint: string): string {
	return maskedStyle(tint, `var(${ninePatchCropVar(region)})`, repeatFor(region, repeat), sizeFor(region, repeat));
}

/** The grid tracks a pieced patch lays its regions on: the corners hold `slice`, the middle takes
 * whatever is left. One value applies to both axes; two split them. */
export function ninePatchTracks(slice: string): string {
	const parts = slice.trim().split(/\s+/);
	const vertical = trackLength(parts[0] ?? "0");
	const horizontal = trackLength(parts[1] ?? parts[0] ?? "0");
	return `grid-template-columns: ${horizontal} 1fr ${horizontal}; grid-template-rows: ${vertical} 1fr ${vertical};`;
}

/**
 * `slice` follows `border-image-slice`, where a bare number means the artwork's own pixels. A grid
 * track has no such rule and drops the whole declaration for a unitless length, which collapses the
 * nine regions into one cell — so a bare number gets its unit here.
 */
function trackLength(value: string): string {
	return /^-?\d*\.?\d+$/.test(value) ? `${value}px` : value;
}

/**
 * The artwork's own pixel size, needed to cut a bare-number `slice` out of it. Read from raw SVG
 * markup or a `data:` SVG; a bitmap behind a URL has no size until it loads, and returns `null`.
 */
export function ninePatchNaturalSize(src: string | null | undefined): { width: number; height: number } | null {
	let value = src?.trim();
	if (!value) return null;
	if (value.startsWith("data:image/svg+xml")) {
		const comma = value.indexOf(",");
		const payload = value.slice(comma + 1);
		try {
			value = value.slice(0, comma).includes(";base64") ? atob(payload) : decodeURIComponent(payload);
		} catch {
			return null;
		}
	}
	if (!value.startsWith("<")) return null;
	const open = /<svg\b[^>]*>/i.exec(value)?.[0];
	if (!open) return null;
	const attr = (name: string): string | null => new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, "i").exec(open)?.[1] ?? null;
	const width = Number.parseFloat(attr("width") ?? "");
	const height = Number.parseFloat(attr("height") ?? "");
	if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) return { width, height };
	const box = (attr("viewBox") ?? "").trim().split(/[\s,]+/).map(Number);
	if (box.length === 4 && box.every(Number.isFinite) && box[2]! > 0 && box[3]! > 0) {
		return { width: box[2]!, height: box[3]! };
	}
	return null;
}

/** A bare-number `slice` in the artwork's own pixels, or `null` when it is a percentage or absent. */
function sliceNumbers(slice: string, natural: { width: number; height: number }): { x: number; y: number } | null {
	const parts = slice.trim().split(/\s+/);
	const read = (raw: string | undefined, extent: number): number | null => {
		if (!raw) return null;
		if (/^-?\d*\.?\d+%$/.test(raw)) return (Number.parseFloat(raw) / 100) * extent;
		return /^-?\d*\.?\d+$/.test(raw) ? Number.parseFloat(raw) : null;
	};
	const y = read(parts[0], natural.height);
	const x = read(parts[1] ?? parts[0], natural.width);
	if (x === null || y === null || x < 0 || y < 0) return null;
	if (x * 2 > natural.width || y * 2 > natural.height) return null;
	return { x, y };
}

/**
 * One region cut out of the artwork, as its own image.
 *
 * A tinted patch masks each region separately, and a mask tiles the *whole* image it is given — so an
 * edge has to be handed its strip alone rather than the sheet it came from. The cut is a `viewBox`
 * over the source, which crops a bitmap and a drawing alike and costs no layout knowledge, so the
 * result still renders with no script running.
 */
function cropRegion(
	source: string,
	natural: { width: number; height: number },
	x: number,
	y: number,
	w: number,
	h: number,
	stretched: boolean,
): string {
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"` +
		` width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}"${stretched ? ` preserveAspectRatio="none"` : ""}>` +
		`<image xlink:href="${source.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}" x="0" y="0"` +
		` width="${natural.width}" height="${natural.height}" preserveAspectRatio="none"/></svg>`;
	return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/**
 * The nine regions of the base artwork, each as its own image, keyed by region. `null` when the
 * artwork's own size is unknown, which is the signal to leave the patch on its untinted draw.
 */
export function ninePatchCrops(
	src: string | null | undefined,
	slice: string,
	repeat: string,
): Partial<Record<NinePatchRegion, string>> | null {
	const natural = ninePatchNaturalSize(src);
	if (!natural) return null;
	const cuts = sliceNumbers(slice, natural);
	if (!cuts) return null;
	const href = resolvedHref(src);
	if (!href) return null;

	const { width: nw, height: nh } = natural;
	const cols = [0, cuts.x, nw - cuts.x];
	const rows = [0, cuts.y, nh - cuts.y];
	const widths = [cuts.x, nw - 2 * cuts.x, cuts.x];
	const heights = [cuts.y, nh - 2 * cuts.y, cuts.y];

	const out = {} as Partial<Record<NinePatchRegion, string>>;
	NINE_PATCH_REGIONS.forEach((region, index) => {
		const col = index % 3;
		const row = Math.floor(index / 3);
		if (widths[col]! <= 0 || heights[row]! <= 0) return;
		out[region] = cropRegion(href, natural, cols[col]!, rows[row]!, widths[col]!, heights[row]!, repeat === "stretch");
	});
	return Object.keys(out).length ? (out as Record<NinePatchRegion, string>) : null;
}

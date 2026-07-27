import { XtyleElement, define, type StyleMode } from "./base.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/nine-patch/source.generated.js";
import { ninePatchHostCss } from "../markup/index.js";
import {
	ninePatchSource,
	ninePatchFrameStyle,
	ninePatchPieceStyle,
	ninePatchTintedRegionStyle,
	ninePatchCrops,
	ninePatchCropVar,
	ninePatchTracks,
	ninePatchRegionVar,
	NINE_PATCH_REGIONS,
	NINE_PATCH_SRC_VAR,
	type NinePatchRegion,
} from "../markup/nine-patch.js";

/**
 * A nine-patch surface: artwork sliced into four fixed corners, four edges that stretch or repeat
 * along their own axis, and a centre that fills. It is the escape hatch for chrome a token cannot
 * describe — a carved frame, a torn edge, a printed border — scaled without smearing the corners.
 *
 * `src` takes a URL, a `data:` URI, or raw SVG markup, so artwork can be a file, an inline drawing,
 * or something an algorithm generated at runtime; SVG and raster are equally at home.
 *
 * `tint` is the part that makes it xtyle's rather than a CSS wrapper: instead of painting the
 * artwork, it uses the artwork as a *mask* over a token colour, so one monochrome patch follows the
 * theme wherever it lands. Shape from the art, colour from the algorithm.
 */
export class XtyleNinePatch extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["src", "slice", "width", "outset", "repeat", "fill", "tint", "inset", "pieces", "tints"];
	}

	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "nine-patch", {
		applyIntent: () => {},
	});

	/** The artwork: a URL, a `data:` URI, or raw SVG markup. */
	get src(): string | null {
		return this.getAttribute("src");
	}
	set src(value: string | null | undefined) {
		this.reflectString("src", value);
	}

	/** Where the four cuts fall, in the artwork's own pixels or as percentages. */
	get slice(): string {
		return this.getAttribute("slice") ?? "33.333%";
	}
	set slice(value: string) {
		this.setAttribute("slice", value);
	}

	/** How thick the drawn frame is. Defaults to the slice's own size. */
	get width(): string {
		return this.getAttribute("width") ?? "auto";
	}
	set width(value: string) {
		this.setAttribute("width", value);
	}

	get outset(): string {
		return this.getAttribute("outset") ?? "0";
	}
	set outset(value: string) {
		this.setAttribute("outset", value);
	}

	/** How the edges cover their run: `stretch`, `repeat`, `round`, or `space`. */
	get repeat(): string {
		return this.getAttribute("repeat") ?? "stretch";
	}
	set repeat(value: string) {
		this.setAttribute("repeat", value);
	}

	/** Paint the middle patch too, rather than leaving the centre to the surface beneath. */
	get fill(): boolean {
		return this.hasAttribute("fill");
	}
	set fill(value: boolean) {
		this.reflectBoolean("fill", value);
	}

	/** A colour or token to tint the artwork with, masking it instead of painting it. */
	get tint(): string | null {
		return this.getAttribute("tint");
	}
	set tint(value: string | null | undefined) {
		this.reflectString("tint", value);
	}

	/** Nine sources keyed by region, for artwork that arrives as separate files rather than one sheet.
	 * Takes an object in the framework bindings and JSON in the HTML attribute. */
	get pieces(): Partial<Record<NinePatchRegion, string>> | null {
		const raw = this.getAttribute("pieces");
		if (!raw) return null;
		try {
			const parsed: unknown = JSON.parse(raw);
			return parsed && typeof parsed === "object" ? (parsed as Partial<Record<NinePatchRegion, string>>) : null;
		} catch {
			return null;
		}
	}
	set pieces(value: Partial<Record<NinePatchRegion, string>> | string | null | undefined) {
		if (value === null || value === undefined) {
			this.reflectString("pieces", null);
			return;
		}
		this.reflectString("pieces", typeof value === "string" ? value : JSON.stringify(value));
	}

	/** A region's own tint, falling back to the patch's. `tints` lets one segment carry a different
	 * token from the frame it sits on — a gilded corner on a plain border. */
	private pieceTint(region: NinePatchRegion): string | null {
		const raw = this.getAttribute("tints");
		if (raw) {
			try {
				const parsed = JSON.parse(raw) as Partial<Record<NinePatchRegion, string>>;
				const own = parsed?.[region];
				if (typeof own === "string" && own) return own;
			} catch {}
		}
		return this.tint;
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.paint();
	}

	/**
	 * The nine cuts of the base artwork, present only when the patch is tinted and the artwork's own
	 * size is known. A tint cannot ride on `border-image`, and the `mask-border` spelling that carries
	 * it is unimplemented in Firefox — where it degrades to a bare background colour and loses the
	 * drawing. Masking each region against its own cut says the same thing in properties every engine
	 * has, and the grid it lands on resolves its own geometry, so nothing has to run for it to paint.
	 *
	 * Computed once per `paint()` and cached here, since deriving it re-cuts the artwork into nine
	 * SVGs and every one of `bindings`, `shapeSignature`, and `publishSources` reads it.
	 */
	private tintedCrops: Partial<Record<NinePatchRegion, string>> | null = null;

	private computeTintedCrops(): Partial<Record<NinePatchRegion, string>> | null {
		if (!this.tint) return null;
		return ninePatchCrops(this.src, this.slice, this.repeat);
	}

	private get bindings(): Record<string, unknown> {
		const source = ninePatchSource(this.src);
		const pieces = this.pieces;
		const crops = this.tintedCrops;
		return {
			frameStyle: crops
				? null
				: ninePatchFrameStyle({
						source: source ? `var(${NINE_PATCH_SRC_VAR})` : null,
						slice: this.slice,
						width: this.width,
						outset: this.outset,
						repeat: this.repeat,
						fill: this.fill,
						tint: this.tint,
					}),
			regions: crops
				? NINE_PATCH_REGIONS.map((region) => ({
						region,
						style:
							crops[region] && (region !== "center" || this.fill)
								? ninePatchTintedRegionStyle(region, this.repeat, this.tint!)
								: null,
					}))
				: null,
			pieces: pieces
				? NINE_PATCH_REGIONS.map((region) => ({
						region,
						style: ninePatchPieceStyle({
							region,
							source: ninePatchSource(pieces[region]) ? `var(${ninePatchRegionVar(region)})` : null,
							repeat: this.repeat,
							tint: this.pieceTint(region),
						}),
					}))
				: null,
			tracks: ninePatchTracks(this.slice),
			tinted: Boolean(this.tint),
		};
	}

	private shapeSignature(): string {
		return [
			Boolean(this.tint),
			Boolean(this.src),
			Boolean(this.tintedCrops),
			this.fill,
			this.getAttribute("pieces") ?? "",
			this.getAttribute("tints") ?? "",
		].join("|");
	}

	/** Publish the resolved artwork on custom properties the fill references by name. Doing it here
	 * rather than in the fill's CSS is what keeps the sandbox's `url()` sanitizing intact. */
	private publishSources(): void {
		const source = ninePatchSource(this.src);
		this.style.setProperty(NINE_PATCH_SRC_VAR, source ?? "");
		const crops = this.tintedCrops;
		for (const region of NINE_PATCH_REGIONS) {
			this.style.setProperty(ninePatchCropVar(region), crops?.[region] ?? "");
		}
		const pieces = this.pieces;
		for (const region of NINE_PATCH_REGIONS) {
			const own = pieces ? ninePatchSource(pieces[region]) : null;
			this.style.setProperty(ninePatchRegionVar(region), own ?? "");
		}
	}

	private paint(): void {
		this.tintedCrops = this.computeTintedCrops();
		this.publishSources();
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
		const inset = this.getAttribute("inset");
		this.style.setProperty("--xtyle-nine-patch-inset", inset ?? "");
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(ninePatchHostCss);
		this.paint();
	}
}

define("xtyle-nine-patch", XtyleNinePatch);

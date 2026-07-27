import { escapeAttr } from "../escape.js";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, text: string): void;
}

interface NinePatchPiece {
	region: string;
	style: string | null;
}

interface NinePatchBindings {
	/** The frame's own CSS, assembled by the element from the slice metrics. */
	frameStyle?: string | null;
	tinted?: boolean;
	/** Present when the patch was given nine sources instead of one; each is its own node. */
	pieces?: NinePatchPiece[] | null;
	/** The tinted draw: the base artwork cut into nine, each region masking the tint on its own cell. */
	regions?: NinePatchPiece[] | null;
	tracks?: string | null;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: NinePatchBindings, ops: OpsBuilder) => void) => void };
};

/**
 * The frame is a layer of its own rather than a border on the content box, because the tinted mode
 * masks it — and a mask on the host would take the content with it.
 */
function slicedFrame(b: NinePatchBindings): string {
	const cls = ["xtyle-nine-patch__frame", b.tinted ? "xtyle-nine-patch__frame--tinted" : ""]
		.filter(Boolean)
		.join(" ");
	const style = b.frameStyle ? ` style="${escapeAttr(b.frameStyle)}"` : "";
	return `<span class="${cls}" part="frame" aria-hidden="true"${style}></span>`;
}

function regionGrid(cells: NinePatchPiece[], extraClass: string, tracks: string | null | undefined): string {
	const style = tracks ? ` style="${escapeAttr(tracks)}"` : "";
	const html = cells
		.map((cell) => {
			const cls = `xtyle-nine-patch__piece xtyle-nine-patch__piece--${cell.region}`;
			const own = cell.style ? ` style="${escapeAttr(cell.style)}"` : "";
			return `<span class="${cls}" part="piece ${escapeAttr(cell.region)}" data-region="${escapeAttr(cell.region)}"${own}></span>`;
		})
		.join("");
	const cls = ["xtyle-nine-patch__pieces", extraClass].filter(Boolean).join(" ");
	return `<span class="${cls}" part="frame" aria-hidden="true"${style}>${html}</span>`;
}

/** Nine real nodes, each addressable by its region name, so a piece can be restyled, replaced, or
 * tinted on its own — which a single sliced paint cannot offer. Regions with no artwork of their own
 * stay empty, leaving the sliced base beneath them visible. */
function piecedFrame(b: NinePatchBindings): string {
	return regionGrid(b.pieces ?? [], "", b.tracks);
}

function tintedFrame(b: NinePatchBindings): string {
	return regionGrid(b.regions ?? [], "xtyle-nine-patch__frame--tinted", b.tracks);
}

/**
 * The base and the per-region overrides are layers, not alternatives: the base draws the whole frame
 * from one image (or, tinted, one masked cell per region), and any region given its own artwork draws
 * over it. An opaque override reads as a replacement, a transparent one as a decoration laid on top,
 * and a region left unnamed is simply the base showing through.
 */
function inner(b: NinePatchBindings): string {
	const base = b.regions?.length ? tintedFrame(b) : b.frameStyle ? slicedFrame(b) : "";
	const overrides = b.pieces && b.pieces.some((piece) => piece.style) ? piecedFrame(b) : "";
	return `${base}${overrides}<div class="xtyle-nine-patch__content" part="content"><slot></slot></div>`;
}

hooks.fragment.mount("nine-patch", (bindings, ops) => {
	ops.replaceChildren("[data-nine-patch]", inner(bindings));
});

hooks.fragment.update("nine-patch", (bindings, ops) => {
	ops.replaceChildren("[data-nine-patch]", inner(bindings));
});

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, value: string): void;
}

interface RatingBindings {
	/** How many glyphs the row draws. */
	max?: number;
	/** The current rating, already clamped to `0..max` by the element. */
	value?: number;
	/** The glyph name the element was asked to rate with (`star`, `heart`, a mark spec). */
	icon?: string;
	/** The glyph as an SVG string, silhouetted to the neutral track color — one unit of the base row. */
	emptyIcon?: string;
	/** The glyph as an SVG string in full color — one unit of the overlay row. */
	filledIcon?: string;
	readonly?: boolean;
	allowHalf?: boolean;
	size?: string;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: RatingBindings, ops: OpsBuilder) => void) => void };
};

function units(b: RatingBindings): number {
	const max = b.max ?? 5;
	return max > 0 ? max : 0;
}

/** The overlay's clip width. The fill technique is the fragment's own: the base row draws every glyph,
 * the overlay draws the same glyphs in color and is clipped by width, so a fractional value cuts a
 * glyph exactly where the value lands. Override the fill to clip by mask, by count, or not at all. */
function fillWidth(b: RatingBindings): string {
	const max = units(b);
	const value = Math.min(Math.max(b.value ?? 0, 0), max);
	return `width: ${max > 0 ? (value / max) * 100 : 0}%`;
}

function repeat(glyph: string, count: number): string {
	let out = "";
	for (let i = 0; i < count; i++) out += glyph;
	return out;
}

function rowsHtml(b: RatingBindings): string {
	const count = units(b);
	return (
		`<span class="xtyle-rating__row xtyle-rating__row--empty" part="track" aria-hidden="true">` +
		repeat(b.emptyIcon ?? "", count) +
		`</span>` +
		`<span class="xtyle-rating__row xtyle-rating__row--filled" part="fill" aria-hidden="true" style="${fillWidth(b)}">` +
		repeat(b.filledIcon ?? "", count) +
		`</span>`
	);
}

hooks.fragment.mount("rating", (bindings, ops) => {
	ops.replaceChildren("[data-rating]", rowsHtml(bindings));
});

// A value change only moves the clip, so the glyphs are never rebuilt — the element remounts (and the
// rows redraw) only when the glyph count or the glyphs themselves change.
hooks.fragment.update("rating", (bindings, ops) => {
	ops.setAttr('[part="fill"]', "style", fillWidth(bindings));
});

import type { ComponentManifest } from "./types.js";

const FRAME_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><path fill="#000" d="M32 8A8 8 0 0 1 48 8A8 8 0 0 1 64 8A24 24 0 0 1 88 32A8 8 0 0 1 88 48A8 8 0 0 1 88 64A24 24 0 0 1 64 88A8 8 0 0 1 48 88A8 8 0 0 1 32 88A24 24 0 0 1 8 64A8 8 0 0 1 8 48A8 8 0 0 1 8 32A24 24 0 0 1 32 8Z"/></svg>`;

const htmlExample = `<!-- Inline SVG, cut 32px in from each edge, tinted from a token. Paste this as-is. -->
<xtyle-nine-patch slice="32" repeat="repeat" tint="var(--accent)" inset="2.25rem" src='${FRAME_SVG}'>
	<p>The corners hold their size. Only the runs between them grow.</p>
</xtyle-nine-patch>

<!-- The same three attributes over a file: raster and vector are equally at home -->
<xtyle-nine-patch src="/frames/parchment.png" slice="32" repeat="repeat" fill inset="2.25rem">
	<p>A URL is sliced exactly the same way.</p>
</xtyle-nine-patch>

<!-- One region overridden: the base still draws the other eight -->
<xtyle-nine-patch
	src="/frames/parchment.png"
	slice="32"
	pieces='{"top-left":"/frames/crest.svg"}'
	tints='{"top-left":"var(--accent)"}'
	inset="2.25rem"
>
	<p>A crest on one corner, the base everywhere else.</p>
</xtyle-nine-patch>`;

const svelteExample = `<script lang="ts">
	import { NinePatch } from "@xtyle/svelte";

	const frame = \`${FRAME_SVG}\`;
	const crest = \`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path fill="#000" fill-rule="evenodd" d="M16 2 29 9v13l-13 8-13-8V9zm0 6-7 4v8l7 5 7-5v-8z"/></svg>\`;
</script>

<NinePatch src={frame} slice="32" repeat="repeat" tint="var(--accent)" inset="2.25rem">
	<p>A themed surface from one monochrome drawing.</p>
</NinePatch>

<NinePatch
	src={frame}
	slice="32"
	repeat="repeat"
	tint="var(--fg-2)"
	pieces={{ "top-left": crest, "top-right": crest }}
	tints={{ "top-left": "var(--accent)", "top-right": "var(--accent)" }}
	inset="2.25rem"
>
	<p>Two corners swapped, the rest still the base.</p>
</NinePatch>`;

const astroExample = `---
import NinePatch from "@xtyle/astro/NinePatch.astro";

const frame = \`${FRAME_SVG}\`;
---

<NinePatch src={frame} slice="32" repeat="repeat" tint="var(--accent)" inset="2.25rem">
	<p>Shape from the art, colour from the algorithm.</p>
</NinePatch>

<NinePatch src="/frames/parchment.png" slice="32" repeat="repeat" fill inset="2.25rem">
	<p>A file works the same way.</p>
</NinePatch>`;

export const ninePatchManifest: ComponentManifest = {
	id: "nine-patch",
	name: "Nine Patch",
	since: "0.10.0",
	category: "media",
	keywords: ["9-patch", "frame", "border", "scalable", "svg", "raster", "skin", "surface", "tint", "slice"],
	seeAlso: ["image", "card", "panel"],
	summary: "Artwork sliced into a frame that scales without smearing its corners.",
	description:
		"Nine Patch cuts a piece of artwork into nine regions: four corners that never scale, four edges that stretch or repeat along their own axis, and a centre that fills. It is the escape hatch for chrome a token cannot describe — a carved frame, a torn edge, a printed border, a game panel — rendered at any size without the corners smearing. `src` takes a URL, a `data:` URI, or **raw SVG markup**, which it encodes itself; artwork can be a file on disk, a drawing inlined in the page, or something generated at runtime, and vector and raster are equally at home. `slice` says where the four cuts fall, `repeat` picks how the edges cover their run (`stretch`, `repeat`, `round`, `space`), `fill` paints the middle patch, and `inset` holds content clear of the frame. **`tint` is the part that belongs to xtyle**: instead of painting the artwork it uses it as a *mask* over a colour, so a single monochrome patch takes `var(--accent)` — or any token — and follows the theme wherever it lands. Shape from the art, colour from the algorithm, which makes arbitrary surfaces themeable rather than fixed. And the nine regions stay **individually addressable**: `pieces` names artwork for any of them and draws it over the sliced base, so one corner can be swapped for a gem or the top edge for a banner without redrawing the sheet. A region left unnamed is simply the base showing through, an opaque override reads as a replacement, and a transparent one as a decoration laid on top; `tints` can give a single segment its own token.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "frame",
			description: "The sliced artwork, drawn as its own layer so a tint can mask it without masking the content.",
			selector: ".xtyle-nine-patch__frame",
		},
		{
			name: "piece",
			description: "One overridden region, addressable by its name — `part=\"piece top-left\"` and `[data-region]` both reach it.",
			selector: ".xtyle-nine-patch__piece",
		},
		{
			name: "content",
			description: "Whatever was slotted in, held clear of the frame by `inset`.",
			selector: ".xtyle-nine-patch__content",
		},
	],
	props: [
		{
			name: "src",
			type: "string",
			description: "The artwork: a URL, a `data:` URI, or raw SVG markup, which is encoded for you.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "slice",
			type: "string",
			default: "33.333%",
			description: "Where the four cuts fall, in the artwork's own pixels or as percentages.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "width",
			type: "string",
			default: "auto",
			description: "How thick the drawn frame is. `auto` takes the slice's own size.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "repeat",
			type: "\"stretch\" | \"repeat\" | \"round\" | \"space\"",
			default: "stretch",
			description: "How each edge covers its run. `round` scales the tile to fit a whole number of repeats.",
			bindings: ["html", "svelte", "astro"],
			options: ["stretch", "repeat", "round", "space"],
		},
		{
			name: "fill",
			type: "boolean",
			default: "false",
			description: "Paint the middle patch too, rather than leaving the centre to the surface beneath.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "tint",
			type: "string",
			description: "A colour or token to tint the artwork with. The artwork becomes a mask, so one monochrome patch can wear any theme.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "pieces",
			type: "Partial<Record<NinePatchRegion, string>>",
			description: "Artwork for individual regions — `top-left`, `top`, `top-right`, `left`, `center`, `right`, `bottom-left`, `bottom`, `bottom-right` — drawn over the sliced base. Each takes the same three source forms as `src`. Named regions become their own addressable nodes; the rest stay the base.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "tints",
			type: "Partial<Record<NinePatchRegion, string>>",
			description: "A per-region tint, overriding the patch's own. Lets one segment wear a different token from the frame it sits on.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "inset",
			type: "string",
			description: "Padding that holds the slotted content clear of the frame.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "outset",
			type: "string",
			default: "0",
			description: "How far the frame extends beyond the element's box.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [],
	states: [
		{
			name: "tinted",
			description: "The artwork is masking a colour rather than being painted directly.",
			selector: ".xtyle-nine-patch__frame--tinted",
		},
	],
	slots: [
		{
			name: "default",
			description: "The content the frame surrounds.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [],
	composition: [
		"Wrap a `<xtyle-card>` or a `<xtyle-panel>` to give a surface artwork a token cannot describe.",
		"Point `tint` at `var(--accent)` and one monochrome drawing serves every theme, including ones built after the artwork was.",
		"Use `repeat=\"round\"` for artwork with a motif that must not be cut mid-pattern; `stretch` is right for plain gradients and rules.",
		"Hand `src` a generated SVG string when the frame itself should derive — the encoding is done for you.",
		"Override one region with `pieces` to hang a crest on a corner or a banner across the top, without cutting a new sheet.",
	],
	a11y: [
		"The frame is decorative (`aria-hidden`) and takes no pointer events, so it never intercepts a click meant for the content.",
		"Content sits in its own layer above the artwork, so a tint masks the frame without masking the text.",
		"Because the frame is artwork rather than a border, contrast is the author's to check — `tint` pointed at a derived token keeps it moving with the theme rather than drifting from it.",
	],
	examples: [
		{
			id: "raster-svg-and-tint",
			title: "Inline SVG, a file, and a tinted frame",
			description: "The same component fed markup, a file, and a token-tinted mask.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
	],
};

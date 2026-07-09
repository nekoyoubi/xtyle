import type { ComponentManifest } from "./types.js";
import { SERIES_SCHEMES } from "../series.js";
import { FULL_TONES } from "../vocab.js";
import { ICON_NAMES } from "../icons.js";

const htmlExample = `<xtyle-icon name="search"></xtyle-icon>
<xtyle-icon name="check"></xtyle-icon>
<xtyle-icon name="chevron-right"></xtyle-icon>

<xtyle-icon name="menu" size="sm"></xtyle-icon>
<xtyle-icon name="menu" size="lg"></xtyle-icon>`;

const toneHtmlExample = `<xtyle-icon name="success" tone="success"></xtyle-icon>
<xtyle-icon name="warning" tone="warn"></xtyle-icon>
<xtyle-icon name="error" tone="danger"></xtyle-icon>

<xtyle-icon name="loader" spin label="Loading"></xtyle-icon>`;

const svelteExample = `<script lang="ts">
	import { Icon } from "@xtyle/svelte";
</script>

<Icon name="search" />
<Icon name="check" />`;

const toneSvelteExample = `<script lang="ts">
	import { Icon } from "@xtyle/svelte";
</script>

<Icon name="success" tone="success" />
<Icon name="loader" spin label="Loading" />`;

const astroExample = `---
import Icon from "@xtyle/astro/Icon.astro";
---

<Icon name="search" />
<Icon name="check" />`;

const genHtmlExample = `<!-- a name carrying a spec is composed, not looked up -->
<xtyle-icon name="crest--shield-c1--star-s45-cf" size="xl"></xtyle-icon>

<!-- a functional glyph rides as a charge by its bare name -->
<xtyle-icon name="check-badge--circle-c3--check-s55-cf" size="xl"></xtyle-icon>

<!-- a negative-space die: three pips knocked out of a rounded face -->
<xtyle-icon name="dice-3--square3-c1--dot-p7-s14-ko--dot-s14-ko--dot-p3-s14-ko" size="xl"></xtyle-icon>

<!-- the same spec re-skinned by scheme -->
<xtyle-icon name="chip--hex-c1--dot-s30-c2" colors="statuses" size="xl"></xtyle-icon>`;

const genSvelteExample = `<script lang="ts">
	import { Icon } from "@xtyle/svelte";
</script>

<Icon name="crest--shield-c1--star-s45-cf" size="xl" />
<Icon name="chip--hex-c1--dot-s30-c2" colors="statuses" size="xl" />`;

const genAstroExample = `---
import Icon from "@xtyle/astro/Icon.astro";
---

<Icon name="crest--shield-c1--star-s45-cf" size="xl" />
<Icon name="chip--hex-c1--dot-s30-c2" colors="statuses" size="xl" />`;

const toneAstroExample = `---
import Icon from "@xtyle/astro/Icon.astro";
---

<Icon name="success" tone="success" />
<Icon name="error" tone="danger" />`;

export const iconManifest: ComponentManifest = {
	id: "icon",
	name: "Icon",
	since: "0.4.0",
	category: "media",
	keywords: ["glyph", "symbol", "svg", "pictogram", "mark"],
	seeAlso: ["swatch", "avatar", "rating"],
	summary: "A functional glyph, or a mark generated from a name, drawn in the current text color.",
	description:
		"Icon renders one glyph from a small functional set (chevrons, arrows, close, check, the status marks, a spinner, the menu dots, and the media-transport family: play, pause, stop, skip-forward, skip-back) as inline SVG. It carries no color of its own: the glyph is drawn in `currentColor`, so it inherits the text color around it and matches the derived theme with nothing to wire. It sizes off the surrounding type by default, so an icon set beside a word lines up with it; `size` steps it in fixed `em` for a standalone glyph. An optional `tone` tints it to a semantic role or named hue, `spin` turns it into a loading affordance, and a `label` promotes it from decorative to a named image for assistive tech. Beyond the lookup, a `name` can carry a spec: a terse grammar (`shield--star-s45-c1`) the engine parses into a layered mark and composes on the fly, placing primitives on a grid, sizing, rotating, outlining, or knocking them out, and coloring them from the theme's own series via `colors` so a generated mark recolors with the theme. Lookup for the common glyph, generation for everything else, one element for both.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "icon",
			description: "The `<svg>` glyph, drawn in `currentColor` on a 24×24 grid.",
			selector: ".xtyle-icon",
			tokens: [],
		},
	],
	props: [
		{
			name: "name",
			type: "IconName | string",
			description:
				"A functional-set glyph name, or a generated-mark spec (a name carrying a `--` grammar, e.g. `crest--shield-c1--star-s45-cf`). A plain name that is neither renders a visible placeholder box.",
			bindings: ["html", "svelte", "astro"],
			options: [...ICON_NAMES],
		},
		{
			name: "colors",
			type: "SeriesScheme",
			default: "accents",
			description:
				"For a generated mark, the series scheme its `c3+` color slots draw from (`accents`, `skittles`, `statuses`, …), so one spec re-skins across schemes. Ignored for a functional glyph.",
			bindings: ["html", "svelte", "astro"],
			options: [...SERIES_SCHEMES],
		},
		{
			name: "size",
			type: "IconSize",
			default: "md",
			description: "The glyph size, stepping in `em` off the surrounding text: `sm`, `md`, `lg`, `xl`. Omit to match the current text size.",
			bindings: ["html", "svelte", "astro"],
			options: ["sm", "md", "lg", "xl"],
		},
		{
			name: "tone",
			type: "FullTone",
			description:
				"Tints the glyph to a semantic role (accent, success, danger, …) or a named hue (red … black). Omit to inherit the surrounding `currentColor`.",
			bindings: ["html", "svelte", "astro"],
			options: [...FULL_TONES],
		},
		{
			name: "label",
			type: "string",
			description:
				"An accessible name. Set it and the icon is exposed as an image with this name; omit it and the icon is decorative and hidden from assistive tech.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "spin",
			type: "boolean",
			default: "false",
			description: "Continuously rotates the glyph as a loading affordance. Honors `prefers-reduced-motion`.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "static",
			type: "boolean",
			default: "false",
			description:
				"Astro only: emit the resolved light-DOM markup but never load the runtime to hydrate it, for a zero-JS glyph or mark. The Svelte and raw-element paths always upgrade, so they carry no equivalent.",
			bindings: ["astro"],
		},
	],
	variants: [],
	sizes: [
		{ name: "sm", description: "A compact glyph for dense inline hints.", className: "xtyle-icon--sm" },
		{ name: "md", description: "The default glyph, matching body text.", className: "xtyle-icon", isDefault: true },
		{ name: "lg", description: "A prominent glyph for a featured control.", className: "xtyle-icon--lg" },
		{ name: "xl", description: "A large glyph for an empty-state or hero mark.", className: "xtyle-icon--xl" },
	],
	states: [
		{
			name: "spin",
			description: "Rotates continuously as a loading affordance; suppressed under reduced-motion.",
			selector: ".xtyle-icon--spin",
		},
	],
	slots: [],
	consumedTokens: [...FULL_TONES.map((t) => `--${t}`)],
	composition: [
		"Drop an Icon inside a `Button` before or after the label for an icon-and-text control, or on its own in an icon-only button.",
		"Set an Icon inline in `Text` at its default size to sit a glyph on the baseline mid-sentence.",
		"Pair `tone` with a matching status glyph (`success` + `tone=\"success\"`) for a colored inline indicator.",
		"Use `spin` on the `loader` glyph for a lightweight busy indicator where a full `Spinner` is too much.",
	],
	a11y: [
		"Decorative by default: with no `label` the icon is `aria-hidden`, so an adjacent text label carries the meaning and the icon is not announced twice.",
		"Set `label` for a standalone icon that conveys meaning on its own (an icon-only button's glyph); it becomes `role=\"img\"` with the name.",
		"`spin` honors `prefers-reduced-motion`, freezing the glyph for users who ask for less motion.",
	],
	examples: [
		{
			id: "glyphs-and-sizes",
			title: "Glyphs and sizes",
			description: "A few glyphs from the set, and the size steps.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "toned-and-spinning",
			title: "Toned and spinning",
			description: "A `tone` colors the glyph; `spin` turns the loader into a busy indicator.",
			source: { html: toneHtmlExample, svelte: toneSvelteExample, astro: toneAstroExample },
		},
		{
			id: "generated-marks",
			title: "Generated marks",
			description:
				"A `name` carrying a spec is composed on the fly: primitives on a grid, sized / rotated / outlined / knocked out, colored from the theme's series via `colors`.",
			source: { html: genHtmlExample, svelte: genSvelteExample, astro: genAstroExample },
		},
	],
};

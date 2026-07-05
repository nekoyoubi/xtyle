import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-carousel label="Product photos">
	<img src="/a.jpg" alt="Front" />
	<img src="/b.jpg" alt="Side" />
	<img src="/c.jpg" alt="Back" />
</xtyle-carousel>`;

const autoplayHtmlExample = `<xtyle-carousel label="Highlights" autoplay interval="4000" loop>
	<div>Slide one</div>
	<div>Slide two</div>
	<div>Slide three</div>
</xtyle-carousel>`;

const autoplaySvelteExample = `<script lang="ts">
	import { Carousel } from "@xtyle/svelte";
</script>

<Carousel label="Highlights" autoplay interval={4000} loop>
	<div>Slide one</div>
	<div>Slide two</div>
</Carousel>`;

const autoplayAstroExample = `---
import Carousel from "@xtyle/astro/Carousel.astro";
---

<Carousel label="Highlights" autoplay interval={4000} loop>
	<div>Slide one</div>
	<div>Slide two</div>
</Carousel>`;

const svelteExample = `<script lang="ts">
	import { Carousel } from "@xtyle/svelte";
</script>

<Carousel label="Product photos">
	<img src="/a.jpg" alt="Front" />
	<img src="/b.jpg" alt="Side" />
</Carousel>`;

const astroExample = `---
import Carousel from "@xtyle/astro/Carousel.astro";
import Image from "@xtyle/astro/Image.astro";
---

<Carousel label="Gallery">
	<Image src="/a.jpg" alt="First" ratio="16/9" />
	<Image src="/b.jpg" alt="Second" ratio="16/9" />
</Carousel>`;

export const carouselManifest: ComponentManifest = {
	id: "carousel",
	name: "Carousel",
	since: "0.4.0",
	category: "media",
	summary: "A scroll-snap track of slides with prev/next controls, dots, keyboard, and opt-in autoplay.",
	description:
		"Carousel lays its slotted children out as a horizontal scroll-snap track: each child is a slide, and the browser's own scrolling does the paging, so the track is swipeable and keyboard-scrollable with no JavaScript at all. When the runtime is present it grows a control bar, prev and next buttons (drawn with the chevron icons), a row of pagination dots that track and drive the active slide, and arrow-key and Home/End navigation, all wired over the same native scroll. An opt-in `autoplay` advances the track on an `interval`, pausing on hover and focus and standing still entirely under `prefers-reduced-motion`; `loop` wraps the ends. It is content-agnostic: the slides can be `Image`s, `Card`s, or any markup, and it exposes itself as a labelled carousel region with each slide named for assistive tech.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "track",
			description: "The horizontal scroll-snap container that holds and pages the slides.",
			selector: ".xtyle-carousel__track",
			tokens: ["--space-3"],
		},
		{
			name: "nav",
			description: "The prev/next buttons.",
			selector: ".xtyle-carousel__nav",
			tokens: ["--bg-1", "--fg-1", "--line-2", "--radius-full"],
		},
		{
			name: "dots",
			description: "The pagination dots; the active one takes the accent.",
			selector: ".xtyle-carousel__dot",
			tokens: ["--bg-3", "--accent"],
		},
	],
	props: [
		{
			name: "label",
			type: "string",
			description: "The accessible name for the carousel region. Always set it so assistive tech can announce the carousel.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "autoplay",
			type: "boolean",
			default: "false",
			description: "Auto-advances the track on the `interval`. Pauses on hover and focus, and never runs under reduced-motion.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "interval",
			type: "number",
			default: "5000",
			description: "The autoplay dwell per slide, in milliseconds.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "loop",
			type: "boolean",
			default: "false",
			description: "Wraps past the last slide back to the first (and the prev/next buttons stay enabled at the ends).",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "controls",
			type: "boolean",
			default: "true",
			description: "Shows the prev/next buttons. Set `controls=\"false\"` to hide them and rely on swipe, dots, and keys.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "dots",
			type: "boolean",
			default: "true",
			description: "Shows the pagination dots. Set `dots=\"false\"` to hide them.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [],
	states: [],
	slots: [
		{
			name: "default",
			description: "The slides. Each direct child becomes one slide in the track (an `Image`, a `Card`, or any markup).",
			bindings: ["html", "svelte", "astro"],
		},
	],
	consumedTokens: [
		"--bg-1",
		"--bg-2",
		"--bg-3",
		"--fg-1",
		"--fg-2",
		"--accent",
		"--line-2",
		"--radius-full",
		"--border-thin",
		"--border-thick",
		"--ring",
		"--space-2",
		"--space-3",
		"--space-6",
		"--duration-fast",
		"--ease-standard",
	],
	composition: [
		"Put `Image`s in the track for a photo gallery; pair each with a `ratio` so the slides stay a consistent height.",
		"Slot `Card`s for a featured-content rail, or any markup for a testimonial or onboarding sequence.",
		"Set `autoplay` with `loop` for an unattended hero rotation; it pauses the moment a user hovers or focuses it.",
		"Set `controls=\"false\"` on a touch-first surface to lean on swipe and dots alone.",
	],
	a11y: [
		"The carousel is a labelled `region` with `aria-roledescription=\"carousel\"`, and each slide is a labelled group announced as `N of M`.",
		"The track is focusable and scrolls with the arrow keys and Home/End; the prev/next buttons and dots are labelled controls.",
		"Autoplay pauses on hover and focus, and stops entirely under `prefers-reduced-motion`, so motion never runs against a user's stated preference.",
		"With no JavaScript the slides remain visible and the track stays natively scrollable, so no content is trapped behind the enhancement.",
	],
	examples: [
		{
			id: "gallery",
			title: "Image gallery",
			description: "A few slides in a scroll-snap track with prev/next controls and dots.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "autoplay",
			title: "Autoplay and loop",
			description: "An auto-advancing, looping track that pauses on hover or focus.",
			source: { html: autoplayHtmlExample, svelte: autoplaySvelteExample, astro: autoplayAstroExample },
		},
	],
};

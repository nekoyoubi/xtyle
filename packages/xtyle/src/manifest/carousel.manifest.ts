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

const transitionHtmlExample = `<xtyle-carousel label="Featured" transition="fade" autoplay loop>
	<div>First</div>
	<div>Second</div>
	<div>Third</div>
</xtyle-carousel>`;

const transitionSvelteExample = `<Carousel label="Featured" transition="fade" autoplay loop>
	<div>First</div>
	<div>Second</div>
	<div>Third</div>
</Carousel>`;

const transitionAstroExample = `<Carousel label="Featured" transition="fade" autoplay loop>
	<div>First</div>
	<div>Second</div>
	<div>Third</div>
</Carousel>`;

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
	keywords: ["slideshow", "gallery", "slides", "swiper", "scroll snap", "slider"],
	seeAlso: ["image", "hero", "tabs"],
	summary: "A scroll-snap track of slides with prev/next controls, dots, keyboard, and opt-in autoplay.",
	description:
		"Carousel lays its slotted children out as a horizontal scroll-snap track: each child is a slide, and the browser's own scrolling does the paging, so the track is swipeable and keyboard-scrollable with no JavaScript at all. When the runtime is present it grows a control bar, prev and next buttons (drawn with the chevron icons), a row of pagination dots that track and drive the active slide, and arrow-key and Home/End navigation, all wired over the same native scroll. An opt-in `autoplay` advances the track on an `interval`, pausing on hover and focus and standing still entirely under `prefers-reduced-motion`; `loop` wraps the ends seamlessly, scrolling into an inert clone of the far slide and then silently snapping to the real one so the wrap never rewinds. The `transition` prop swaps the paging model: `slide` keeps the scroll-snap track, while `fade`, `scale`, and `flip` stack the slides and cross-fade the active one, so a testimonial or hero rotator can dissolve rather than slide. It is content-agnostic: the slides can be `Image`s, `Card`s, or any markup, and it exposes itself as a labelled carousel region with each slide named for assistive tech.\n\nEverything the carousel draws — the viewport, the track, the control bar, the arrows, the dots, and the play toggle — is its fragment's markup, so a mod can restyle or restructure the chrome (swap the chevrons for arrows, turn the dots into thumbnails, move the bar) without touching the scroll math, the keyboard, or the loop. The slides themselves are never re-authored: the fill's track is filled with the consumer's own nodes, so framework content stays live.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "viewport",
			description: "The clipping frame around the track. It sets the vertical carousel's height from `--carousel-height`.",
			selector: ".xtyle-carousel__viewport",
			tokens: [],
		},
		{
			name: "track",
			description:
				"The scroll-snap container that holds and pages the slides. The consumer's slides are relocated into it, so they stay the same live nodes they were authored as.",
			selector: ".xtyle-carousel__track",
			tokens: ["--space-3", "--ring", "--border-thick"],
		},
		{
			name: "controls",
			description: "The bar the arrows, dots, and play toggle sit in, below the track — or floated over the slides under `controls=\"overlay\"`.",
			selector: ".xtyle-carousel__controls",
			tokens: ["--space-3", "--surface-overlay", "--surface-overlay-border"],
		},
		{
			name: "nav",
			description: "The prev/next buttons, each drawn with the chevron pointing the way the track advances.",
			selector: ".xtyle-carousel__nav",
			tokens: ["--bg-1", "--bg-2", "--fg-1", "--line-2", "--radius-full", "--elevation-2"],
		},
		{
			name: "play",
			description: "The play/pause toggle an autoplay carousel grows, so the motion can always be stopped outright.",
			selector: ".xtyle-carousel__nav--play",
			tokens: ["--bg-1", "--fg-1", "--line-2", "--radius-full"],
		},
		{
			name: "dots",
			description:
				"The pagination dots; the active one takes the accent. When the theme's `--selection-cue` resolves to `marker`, the active dot also elongates into a pill so the current slide reads by shape, not color alone.",
			selector: ".xtyle-carousel__dot",
			tokens: ["--bg-3", "--fg-2", "--fg-3", "--accent", "--selection-cue", "--space-2", "--duration-fast", "--ease-standard"],
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
			description: "Wraps seamlessly past the last slide to the first (and back): the track scrolls forward into an inert clone of the far slide, then silently snaps to the real one, so the wrap reads as continuous motion instead of a rewind. The prev/next buttons stay enabled at the ends.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "controls",
			type: "boolean | \"overlay\"",
			default: "true",
			description: "Where the prev/next buttons sit: `true` renders them in a bar below the track; `\"overlay\"` floats them on the slide edges (arrows at the left/right, dots and the play toggle over the bottom) for an in-image gallery; `\"false\"` hides them and relies on swipe, dots, and keys. The overlay layer is click-through except for the controls, so a swipe or a link inside a slide still works.",
			bindings: ["html", "svelte", "astro"],
			options: ["true", "false", "overlay"],
		},
		{
			name: "dots",
			type: "boolean",
			default: "true",
			description: "Shows the pagination dots. Set `dots=\"false\"` to hide them.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "pause-on-hover",
			type: "boolean",
			default: "true",
			description: "Whether hovering or focusing the carousel pauses autoplay. Set `pause-on-hover=\"false\"` when the rotation is the point and should keep running under the pointer: a decorative marquee, an ambient gallery, or a preview revealed inside an `Image`'s `hover` slot (which only shows while hovered, so a hover-pause would freeze it on its first slide). The explicit play/pause toggle and `prefers-reduced-motion` still stop it, so the content stays pausable.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "transition",
			type: "CarouselTransition",
			default: "slide",
			description: "How slides change. `slide` (the default) pages a scroll-snap track sideways; `fade`, `scale`, and `flip` instead stack the slides and cross-fade the active one (`scale` adds a subtle zoom, `flip` a card turn). The stacked modes have no swipe track, so they lean on the controls, dots, and keys.",
			bindings: ["html", "svelte", "astro"],
			options: ["slide", "fade", "scale", "flip"],
		},
		{
			name: "direction",
			type: "CarouselDirection",
			default: "right",
			description: "Which way a `slide` carousel advances. `right` (the default) and `left` page a horizontal track; `up` and `down` a vertical one (give it a height with `--carousel-height`, default `18rem`). `left` and `up` reverse the sense. Moot for the stacked transitions.",
			bindings: ["html", "svelte", "astro"],
			options: ["right", "left", "up", "down"],
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
		"--fg-3",
		"--accent",
		"--line-2",
		"--surface-overlay",
		"--surface-overlay-border",
		"--radius-full",
		"--border-thin",
		"--border-thick",
		"--ring",
		"--elevation-2",
		"--selection-cue",
		"--space-2",
		"--space-3",
		"--space-6",
		"--duration-fast",
		"--duration-slow",
		"--ease-standard",
		"--ease-emphasized",
	],
	composition: [
		"Put `Image`s in the track for a photo gallery; pair each with a `ratio` so the slides stay a consistent height.",
		"Slot `Card`s for a featured-content rail, or any markup for a testimonial or onboarding sequence.",
		"Set `autoplay` with `loop` for an unattended hero rotation; it pauses the moment a user hovers or focuses it.",
		"Set `controls=\"false\"` on a touch-first surface to lean on swipe and dots alone.",
		"A vertical `direction` (`up` / `down`) suits uniform, media-shaped slides: it pins each slide to `--carousel-height` and clips the overflow, so give it a height that fits the content and reach for it over long text cards.",
	],
	a11y: [
		"The carousel is a labelled `region` with `aria-roledescription=\"carousel\"`, and each slide is a labelled group announced as `N of M`.",
		"The track is focusable and scrolls with the arrow keys and Home/End; the prev/next buttons and dots are labelled controls.",
		"Autoplay pauses on hover and focus, and stops entirely under `prefers-reduced-motion`, so motion never runs against a user's stated preference.",
		"An autoplay carousel grows a persistent play/pause toggle in the control bar (WCAG 2.2.2): the user can stop the motion outright, and a deliberate pause survives a pointer leaving and re-entering, unlike the transient hover pause.",
		"The active slide is announced through a polite live region (`Slide N of M`), so a screen-reader user hears each change even though scrolling, or a stacked cross-fade, never moves focus.",
		"With no JavaScript the slides remain visible and the track stays natively scrollable, so no content is trapped behind the enhancement.",
		"The current slide carries a non-color channel on demand: when the theme sets `--selection-cue: marker`, the active dot elongates into a pill alongside the accent color, so which slide is current never rests on color alone (WCAG 1.4.1). High-contrast emits `marker` by default, and any algorithm can opt in via the `cues` knob.",
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
		{
			id: "transition",
			title: "Fade transition",
			description: "A stacked cross-fade instead of a sliding track, for a testimonial or hero rotator.",
			source: { html: transitionHtmlExample, svelte: transitionSvelteExample, astro: transitionAstroExample },
		},
	],
};

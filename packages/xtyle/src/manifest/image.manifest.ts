import type { ComponentManifest } from "./types.js";

const htmlExample = `<xtyle-image
	src="/photo.jpg"
	alt="A city skyline at dusk"
	ratio="16/9"
	caption="Downtown, golden hour"
></xtyle-image>`;

const lightboxHtmlExample = `<xtyle-image
	src="/photo.jpg"
	alt="A city skyline at dusk"
	ratio="4/3"
	lightbox
></xtyle-image>`;

const svelteExample = `<script lang="ts">
	import { Image } from "@xtyle/svelte";
</script>

<Image src="/photo.jpg" alt="A city skyline at dusk" ratio="16/9" />`;

const lightboxSvelteExample = `<script lang="ts">
	import { Image } from "@xtyle/svelte";
</script>

<Image src="/photo.jpg" alt="A city skyline at dusk" ratio="4/3" lightbox />`;

const astroExample = `---
import Image from "@xtyle/astro/Image.astro";
---

<Image src="/photo.jpg" alt="A city skyline at dusk" ratio="16/9" caption="Downtown, golden hour" />`;

const lightboxAstroExample = `---
import Image from "@xtyle/astro/Image.astro";
---

<Image src="/photo.jpg" alt="A city skyline at dusk" ratio="4/3" lightbox />`;

const triggerHtmlExample = `<xtyle-image
	src="/photo.jpg"
	alt="A city skyline at dusk"
	ratio="4/3"
	lightbox
	trigger="button"
></xtyle-image>`;

const triggerSvelteExample = `<script lang="ts">
	import { Image } from "@xtyle/svelte";
</script>

<Image src="/photo.jpg" alt="A city skyline at dusk" ratio="4/3" lightbox trigger="button" />`;

const triggerAstroExample = `---
import Image from "@xtyle/astro/Image.astro";
---

<Image src="/photo.jpg" alt="A city skyline at dusk" ratio="4/3" lightbox trigger="button" />`;

const delegatedHtmlExample = `<!-- Mount the controller once, anywhere in the page -->
<xtyle-lightbox scope="#article"></xtyle-lightbox>

<!-- Any [data-xtyle-lightbox] in scope opens the shared lightbox, including
     raw markup a component never rendered (a marked / CMS body). -->
<article id="article">
	<img src="/thumb.jpg" alt="A city skyline at dusk" data-xtyle-lightbox
		data-lightbox-src="/full.jpg" data-lightbox-caption="Downtown at dusk" />
</article>`;

const imperativeSvelteExample = `<script lang="ts">
	import { openLightbox } from "@xtyle/core/elements";

	// Drive the same lightbox from any handler — a thumbnail grid, a keyboard
	// shortcut, a router event — with no component wrapping the image.
	function view(src: string, alt: string) {
		openLightbox(src, { alt, caption: alt });
	}
</script>

<button onclick={() => view("/full.jpg", "A city skyline at dusk")}>
	<img src="/thumb.jpg" alt="A city skyline at dusk" />
</button>`;

export const imageManifest: ComponentManifest = {
	id: "image",
	name: "Image",
	since: "0.4.0",
	category: "media",
	keywords: ["picture", "photo", "img", "figure", "lightbox", "aspect ratio"],
	seeAlso: ["avatar", "carousel", "skeleton"],
	summary: "A responsive image in an aspect-ratio frame, with a loading shimmer and an opt-in lightbox.",
	description:
		"Image wraps a picture in a frame that holds its shape while it loads: give it a `ratio` and the box reserves the space so the page never reflows when the pixels arrive, and a shimmer placeholder fills the frame until they do, fading the image in on load. It stays honest with JavaScript off; the image renders at full opacity with no shimmer to hide it, and the blur-up is a progressive enhancement layered on top, never a curtain that traps the image behind a script that failed to run. `fit` chooses cover or contain, `radius` rounds the frame off the scale, an optional `caption` renders a `figcaption`, and native `loading=\"lazy\"` defers off-screen images for free. Set `lightbox` and the frame becomes a control that opens the full image in a top-layer dialog: a scrim, a close button, backdrop and Escape to dismiss, and focus handled by the platform, all wired only when the runtime is present so the static markup stays inert and safe. By default the whole frame is the zoom target; where that sits next to selectable prose, `trigger=\"button\"` moves the affordance onto a dedicated zoom button that reveals on hover and focus, so a click meant for the surrounding text never trips the modal. The per-`<Image>` lightbox is the common case; for images the component never rendered — a `marked`/CMS body injected as raw `{@html}`, a gallery of mixed sources — the same lightbox is available standalone: mount one `<xtyle-lightbox>` and it opens any `[data-xtyle-lightbox]` element in its scope (promoting non-interactive ones to keyboard-operable), or call the imperative `openLightbox(src, { alt, caption })` from `@xtyle/core/elements` from any click handler. One controller, one dialog, every image source.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "frame",
			description: "The aspect-ratio box that clips the image and holds its shape while loading.",
			selector: ".xtyle-image__frame",
			tokens: ["--bg-2", "--radius-md"],
		},
		{
			name: "placeholder",
			description: "The shimmer shown behind the image while it loads.",
			selector: ".xtyle-image__placeholder",
			tokens: ["--bg-2", "--bg-3", "--duration-slow"],
		},
		{
			name: "caption",
			description: "The optional caption rendered as a `figcaption` below the frame.",
			selector: ".xtyle-image__caption",
			tokens: ["--fg-2", "--text-sm"],
		},
		{
			name: "lightbox",
			description: "The full-image viewer: an `<xtyle-dialog>` restyled by the `.xtyle-lightbox` host class, so it inherits the dialog's scrim, close button, focus trap, Escape, and body-portal, and stays app-overridable.",
			selector: ".xtyle-lightbox",
			tokens: ["--bg-1"],
		},
		{
			name: "zoom",
			description: "The hover- and focus-revealed zoom button that opens the lightbox when `trigger=\"button\"`.",
			selector: ".xtyle-image__zoom",
			tokens: ["--bg-1", "--fg-1", "--radius-full", "--surface-overlay-border", "--elevation-3"],
		},
	],
	props: [
		{
			name: "src",
			type: "string",
			description: "The image URL.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "alt",
			type: "string",
			description: "The alternative text. Leave empty only for a decorative image; it carries the accessible name and the lightbox trigger's label.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "ratio",
			type: "string",
			description: "An aspect ratio for the frame (a CSS `aspect-ratio` value like `16/9` or `1/1`). Omit to size to the image's natural ratio.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "fit",
			type: "ImageFit",
			default: "cover",
			description: "How the image fills the frame: `cover` crops to fill, `contain` fits the whole image.",
			bindings: ["html", "svelte", "astro"],
			options: ["cover", "contain"],
		},
		{
			name: "radius",
			type: "ImageRadius",
			default: "md",
			description: "The frame's corner rounding off the radius scale: `none`, `sm`, `md`, `lg`.",
			bindings: ["html", "svelte", "astro"],
			options: ["none", "sm", "md", "lg"],
		},
		{
			name: "loading",
			type: "ImageLoading",
			default: "lazy",
			description: "The native browser loading strategy: `lazy` defers off-screen images, `eager` loads immediately.",
			bindings: ["html", "svelte", "astro"],
			options: ["lazy", "eager"],
		},
		{
			name: "lightbox",
			type: "boolean",
			default: "false",
			description: "Makes the frame a control that opens the full image in a top-layer dialog. Wired only when the runtime is present.",
			bindings: ["html", "svelte", "astro"],
		},
		{
			name: "trigger",
			type: "ImageTrigger",
			default: "frame",
			description: "What opens the lightbox: `frame` makes the whole image the zoom target, `button` moves it onto a dedicated zoom button that reveals on hover and focus, so click-to-zoom doesn't fight a text selection nearby. Only relevant with `lightbox`.",
			bindings: ["html", "svelte", "astro"],
			options: ["frame", "button"],
		},
		{
			name: "caption",
			type: "string",
			description: "An optional caption, rendered as a `figcaption` below the frame.",
			bindings: ["html", "svelte", "astro"],
		},
	],
	variants: [],
	sizes: [],
	states: [
		{
			name: "loading",
			description: "While the image loads: the shimmer placeholder shows and the image is held at zero opacity.",
			selector: ".xtyle-image__frame[data-loading]",
		},
		{
			name: "error",
			description: "When the image fails to load: a muted frame with a warning glyph replaces the picture.",
			selector: ".xtyle-image__frame[data-error]",
		},
	],
	slots: [],
	consumedTokens: [
		"--bg-1",
		"--bg-2",
		"--bg-3",
		"--fg-1",
		"--fg-2",
		"--radius-sm",
		"--radius-md",
		"--radius-lg",
		"--radius-full",
		"--duration-fast",
		"--duration-slow",
		"--ease-standard",
		"--text-sm",
		"--leading-normal",
		"--space-2",
		"--space-3",
		"--space-7",
		"--ring",
		"--border-thin",
		"--border-thick",
		"--surface-overlay-border",
		"--elevation-3",
	],
	composition: [
		"Give every content image a `ratio` so the frame reserves its space and the page doesn't reflow as images load.",
		"Drop an Image into a `Card` media slot for a thumbnail with a caption, or into a `Grid` for a gallery.",
		"Set `lightbox` on gallery thumbnails so a click opens the full image over a scrim; the close control uses the built-in `close` icon.",
		"For images the component never rendered (a markdown/CMS body, a `{@html}` block, mixed sources), mount one `<xtyle-lightbox>` and tag images with `data-xtyle-lightbox`, or call `openLightbox(src, { alt, caption })` — one shared dialog, not a second bespoke lightbox.",
		"Pair `fit=\"contain\"` with a framed `ratio` for logos or art that must not be cropped.",
	],
	a11y: [
		"Always set `alt`: it names the image for assistive tech and labels the lightbox trigger. Use an empty `alt` only for a purely decorative image.",
		"The lightbox opens a native modal dialog, so focus is trapped inside it, Escape closes it, and focus returns to the trigger on close, all handled by the platform.",
		"The standalone `<xtyle-lightbox>` promotes any non-interactive `[data-xtyle-lightbox]` trigger to keyboard-operable (`role=\"button\"`, a tab stop, an `aria-label` from the image `alt`) and opens on Enter or Space, so the delegated path is never mouse-only.",
		"`trigger=\"button\"` renders a real `<button>` for the zoom control, so it is keyboard-focusable and activates with Enter or Space; it reveals on hover and on focus so a keyboard user always sees it, and stays visible on touch, where there is no hover. Both trigger modes carry the image's `alt` as their accessible name.",
		"The blur-up and lightbox are progressive enhancements: with no JavaScript the image renders normally and is never hidden behind a script.",
		"The loading shimmer and the fade-in honor `prefers-reduced-motion`.",
	],
	examples: [
		{
			id: "framed-with-caption",
			title: "Framed with a caption",
			description: "A responsive image in a `16/9` frame with a caption; the frame reserves its space while the image loads.",
			source: { html: htmlExample, svelte: svelteExample, astro: astroExample },
		},
		{
			id: "lightbox",
			title: "Lightbox",
			description: "Set `lightbox` and the frame opens the full image in a top-layer dialog on click.",
			source: { html: lightboxHtmlExample, svelte: lightboxSvelteExample, astro: lightboxAstroExample },
		},
		{
			id: "trigger-button",
			title: "Zoom button",
			description: "Add `trigger=\"button\"` to move the zoom control onto a dedicated hover- and focus-revealed button, so click-to-zoom doesn't fight a selection in the text beside it.",
			source: { html: triggerHtmlExample, svelte: triggerSvelteExample, astro: triggerAstroExample },
		},
		{
			id: "standalone-controller",
			title: "Standalone lightbox for any image source",
			description:
				"Mount one `<xtyle-lightbox>` and it opens any `[data-xtyle-lightbox]` in its scope — including raw `{@html}`/markdown images a component can't wrap — or call `openLightbox(src, { alt, caption })` imperatively. One controller and one dialog serve every image on the page.",
			source: { html: delegatedHtmlExample, svelte: imperativeSvelteExample },
		},
	],
};

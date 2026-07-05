import type { ComponentManifest } from "./types.js";

const htmlExample = `<xoji-image
	src="/photo.jpg"
	alt="A city skyline at dusk"
	ratio="16/9"
	caption="Downtown, golden hour"
></xoji-image>`;

const lightboxHtmlExample = `<xoji-image
	src="/photo.jpg"
	alt="A city skyline at dusk"
	ratio="4/3"
	lightbox
></xoji-image>`;

const svelteExample = `<script lang="ts">
	import { Image } from "@xoji/svelte";
</script>

<Image src="/photo.jpg" alt="A city skyline at dusk" ratio="16/9" />`;

const lightboxSvelteExample = `<script lang="ts">
	import { Image } from "@xoji/svelte";
</script>

<Image src="/photo.jpg" alt="A city skyline at dusk" ratio="4/3" lightbox />`;

const astroExample = `---
import Image from "@xoji/astro/Image.astro";
---

<Image src="/photo.jpg" alt="A city skyline at dusk" ratio="16/9" caption="Downtown, golden hour" />`;

const lightboxAstroExample = `---
import Image from "@xoji/astro/Image.astro";
---

<Image src="/photo.jpg" alt="A city skyline at dusk" ratio="4/3" lightbox />`;

export const imageManifest: ComponentManifest = {
	id: "image",
	name: "Image",
	since: "0.4.0",
	category: "media",
	summary: "A responsive image in an aspect-ratio frame, with a loading shimmer and an opt-in lightbox.",
	description:
		"Image wraps a picture in a frame that holds its shape while it loads: give it a `ratio` and the box reserves the space so the page never reflows when the pixels arrive, and a shimmer placeholder fills the frame until they do, fading the image in on load. It stays honest with JavaScript off; the image renders at full opacity with no shimmer to hide it, and the blur-up is a progressive enhancement layered on top, never a curtain that traps the image behind a script that failed to run. `fit` chooses cover or contain, `radius` rounds the frame off the scale, an optional `caption` renders a `figcaption`, and native `loading=\"lazy\"` defers off-screen images for free. Set `lightbox` and the frame becomes a control that opens the full image in a top-layer dialog: a scrim, a close button, backdrop and Escape to dismiss, and focus handled by the platform, all wired only when the runtime is present so the static markup stays inert and safe.",
	bindings: ["html", "svelte", "astro"],
	anatomy: [
		{
			name: "frame",
			description: "The aspect-ratio box that clips the image and holds its shape while loading.",
			selector: ".xoji-image__frame",
			tokens: ["--bg-2", "--radius-md"],
		},
		{
			name: "placeholder",
			description: "The shimmer shown behind the image while it loads.",
			selector: ".xoji-image__placeholder",
			tokens: ["--bg-2", "--bg-3", "--duration-slow"],
		},
		{
			name: "caption",
			description: "The optional caption rendered as a `figcaption` below the frame.",
			selector: ".xoji-image__caption",
			tokens: ["--fg-2", "--text-sm"],
		},
		{
			name: "lightbox",
			description: "The top-layer dialog that shows the full image, with its scrim and close button.",
			selector: ".xoji-image__lightbox",
			tokens: ["--scrim", "--bg-1"],
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
			selector: ".xoji-image__frame[data-loading]",
		},
		{
			name: "error",
			description: "When the image fails to load: a muted frame with a warning glyph replaces the picture.",
			selector: ".xoji-image__frame[data-error]",
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
		"--duration-slow",
		"--ease-standard",
		"--text-sm",
		"--leading-normal",
		"--space-2",
		"--space-6",
		"--scrim",
		"--ring",
		"--border-thick",
	],
	composition: [
		"Give every content image a `ratio` so the frame reserves its space and the page doesn't reflow as images load.",
		"Drop an Image into a `Card` media slot for a thumbnail with a caption, or into a `Grid` for a gallery.",
		"Set `lightbox` on gallery thumbnails so a click opens the full image over a scrim; the close control uses the built-in `close` icon.",
		"Pair `fit=\"contain\"` with a framed `ratio` for logos or art that must not be cropped.",
	],
	a11y: [
		"Always set `alt`: it names the image for assistive tech and labels the lightbox trigger. Use an empty `alt` only for a purely decorative image.",
		"The lightbox opens a native modal dialog, so focus is trapped inside it, Escape closes it, and focus returns to the trigger on close, all handled by the platform.",
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
	],
};

<script lang="ts">
	import "@xtyle/core/elements/image.js";

	import type { Snippet } from "svelte";
	import { IMAGE_FITS, IMAGE_RADII, IMAGE_LOADING, IMAGE_TRIGGERS, IMAGE_HOVER_AUDIO } from "@xtyle/core";

	type ImageFit = (typeof IMAGE_FITS)[number];
	type ImageRadius = (typeof IMAGE_RADII)[number];
	type ImageLoading = (typeof IMAGE_LOADING)[number];
	type ImageTrigger = (typeof IMAGE_TRIGGERS)[number];
	type ImageHoverAudio = (typeof IMAGE_HOVER_AUDIO)[number];

	interface Props {
		src?: string;
		alt?: string;
		ratio?: string;
		fit?: ImageFit;
		radius?: ImageRadius;
		loading?: ImageLoading;
		lightbox?: boolean;
		trigger?: ImageTrigger;
		caption?: string;
		/** A video (`.mp4`/`.webm`) or gif shown on hover/focus; the still `src` is the poster. */
		hoverSrc?: string;
		/** An explicit poster still for the hover video (defaults to `src`). */
		hoverPoster?: string;
		/** Allow sound on the hover video and show an unmute toggle; omit for a silent preview. */
		hoverAudio?: ImageHoverAudio;
		/** Custom hover-preview content — pass elements carrying `slot="hover"` (a `<video>`, images, or a nested `<Carousel>`). */
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		src,
		alt = "",
		ratio,
		fit = "cover",
		radius = "md",
		loading = "lazy",
		lightbox = false,
		trigger = "frame",
		caption,
		hoverSrc,
		hoverPoster,
		hoverAudio,
		children,
		...rest
	}: Props = $props();
</script>

<xtyle-image
	{...rest}
	{src}
	{alt}
	{ratio}
	{fit}
	{radius}
	{loading}
	{caption}
	lightbox={lightbox ? true : undefined}
	trigger={trigger === "button" ? "button" : undefined}
	hover-src={hoverSrc}
	hover-poster={hoverPoster}
	hover-audio={hoverAudio}
>{@render children?.()}</xtyle-image>

<script lang="ts">
	import "./register.js";

	type ImageFit = "cover" | "contain";
	type ImageRadius = "none" | "sm" | "md" | "lg";
	type ImageLoading = "lazy" | "eager";
	type ImageTrigger = "frame" | "button";

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
	lightbox={lightbox ? "" : undefined}
	trigger={trigger === "button" ? "button" : undefined}
></xtyle-image>

<script lang="ts">
	import "./register.js";

	type ImageFit = "cover" | "contain";
	type ImageRadius = "none" | "sm" | "md" | "lg";
	type ImageLoading = "lazy" | "eager";

	interface Props {
		src?: string;
		alt?: string;
		ratio?: string;
		fit?: ImageFit;
		radius?: ImageRadius;
		loading?: ImageLoading;
		lightbox?: boolean;
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
></xtyle-image>

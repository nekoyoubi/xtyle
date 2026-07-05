<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";

	interface Props {
		minHeight?: string;
		amplitude?: number;
		mode?: "scroll" | "cursor";
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { minHeight, amplitude, mode, children, ...rest }: Props = $props();
</script>

<xoji-parallax {...rest} min-height={minHeight} amplitude={amplitude} mode={mode}>
	{@render children?.()}
</xoji-parallax>

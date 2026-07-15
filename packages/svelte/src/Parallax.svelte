<script lang="ts">
	import "@xtyle/core/elements/parallax.js";
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

<xtyle-parallax {...rest} min-height={minHeight} amplitude={amplitude} mode={mode}>
	{@render children?.()}
</xtyle-parallax>

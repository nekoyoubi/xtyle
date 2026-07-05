<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";

	type HeroAlign = "center" | "start";

	interface Props {
		align?: HeroAlign;
		split?: boolean;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { align = "center", split = false, children, ...rest }: Props = $props();
</script>

<xtyle-hero {...rest} align={align !== "center" ? align : undefined} split={split ? "" : undefined}>
	{@render children?.()}
</xtyle-hero>

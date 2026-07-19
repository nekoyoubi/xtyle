<script lang="ts">
	import "@xtyle/core/elements/hero.js";
	import type { Snippet } from "svelte";
	import { HERO_ALIGNS } from "@xtyle/core";

	type HeroAlign = (typeof HERO_ALIGNS)[number];

	interface Props {
		align?: HeroAlign;
		split?: boolean;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { align = "center", split = false, children, ...rest }: Props = $props();
</script>

<xtyle-hero {...rest} align={align !== "center" ? align : undefined} split={split ? true : undefined}>
	{@render children?.()}
</xtyle-hero>

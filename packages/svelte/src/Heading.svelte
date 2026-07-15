<script lang="ts">
	import "@xtyle/core/elements/heading.js";
	import type { Snippet } from "svelte";
	import type { HeadingLevel, HeadingSize, HeadingTone } from "@xtyle/core";

	interface Props {
		level?: HeadingLevel;
		size?: HeadingSize;
		tone?: HeadingTone;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { level = 2, size, tone = "default", children, ...rest }: Props = $props();
</script>

<xtyle-heading {...rest} level={level} {size} {tone}>
	{@render children?.()}
</xtyle-heading>

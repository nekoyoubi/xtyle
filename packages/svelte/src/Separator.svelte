<script lang="ts">
	import "@xtyle/core/elements/separator.js";
	import type { Snippet } from "svelte";
	import { ORIENTATIONS, SEPARATOR_VARIANTS, SEPARATOR_SIZES } from "@xtyle/core";

	type Orientation = (typeof ORIENTATIONS)[number];
	type SeparatorVariant = (typeof SEPARATOR_VARIANTS)[number];
	type SeparatorSize = (typeof SEPARATOR_SIZES)[number];

	interface Props {
		orientation?: Orientation;
		variant?: SeparatorVariant;
		size?: SeparatorSize;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { orientation = "horizontal", variant = "default", size = "normal", children, ...rest }: Props = $props();
</script>

<xtyle-separator {...rest} {orientation} {variant} {size}>
	{@render children?.()}
</xtyle-separator>

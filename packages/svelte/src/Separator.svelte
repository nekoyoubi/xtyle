<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";

	type Orientation = "horizontal" | "vertical";
	type SeparatorVariant = "default" | "with-label";
	type SeparatorSize = "thin" | "normal";

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

<script lang="ts">
	import "@xtyle/core/elements/table.js";
	import type { Snippet } from "svelte";
	import { TABLE_VARIANTS, TABLE_SIZES } from "@xtyle/core";

	type TableVariant = (typeof TABLE_VARIANTS)[number];
	type TableSize = (typeof TABLE_SIZES)[number];

	interface Props {
		variant?: TableVariant;
		size?: TableSize;
		hover?: boolean;
		sticky?: boolean;
		/** Cap the wrapper's height so it scrolls internally — what `sticky` needs to have a scrollport to stick within. Any CSS length. */
		maxHeight?: string;
		/** Row selection: `none` (default) leaves the native table alone; otherwise the body rows become a selectable, arrow-navigable grid keyed by each row's `data-value`. */
		selection?: "none" | "single" | "multi" | "range";
		ariaLabel?: string;
		children?: Snippet;
		/** Fires when the selection, sort, or column state changes. */
		onchange?: (event: Event) => void;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		variant = "default",
		size = "normal",
		hover = false,
		sticky = false,
		maxHeight,
		selection = "none",
		ariaLabel,
		onchange,
		children,
		...rest
	}: Props = $props();
</script>

<xtyle-table
	{...rest}
	{onchange}
	{variant}
	{size}
	hover={hover || undefined}
	sticky={sticky || undefined}
	max-height={maxHeight}
	selection={selection !== "none" ? selection : undefined}
	aria-label={ariaLabel ?? (rest["aria-label"] as string | undefined)}
>
	{@render children?.()}
</xtyle-table>

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
		/** Row selection: `none` (default) leaves the native table alone; otherwise the body rows become a selectable, arrow-navigable grid keyed by each row's `data-value`. */
		selection?: "none" | "single" | "multi" | "range";
		ariaLabel?: string;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		variant = "default",
		size = "normal",
		hover = false,
		sticky = false,
		selection = "none",
		ariaLabel,
		children,
		...rest
	}: Props = $props();
</script>

<xtyle-table
	{...rest}
	{variant}
	{size}
	hover={hover || undefined}
	sticky={sticky || undefined}
	selection={selection !== "none" ? selection : undefined}
	aria-label={ariaLabel ?? (rest["aria-label"] as string | undefined)}
>
	{@render children?.()}
</xtyle-table>

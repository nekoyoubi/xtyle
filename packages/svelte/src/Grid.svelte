<script lang="ts">
	import "@xtyle/core/elements/grid.js";
	import type { Snippet } from "svelte";
	import { GRID_ALIGNS, GRID_SIDES } from "@xtyle/core";

	type GridAlign = (typeof GRID_ALIGNS)[number];
	type GridSide = (typeof GRID_SIDES)[number];

	interface Props {
		gap?: number;
		columns?: number;
		minColWidth?: string;
		sidebar?: string;
		side?: GridSide;
		align?: GridAlign;
		justify?: GridAlign;
		inline?: boolean;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { gap = 4, columns, minColWidth, sidebar, side, align, justify, inline = false, children, ...rest }: Props =
		$props();
</script>

<xtyle-grid
	{...rest}
	{gap}
	{columns}
	min-col-width={minColWidth}
	{sidebar}
	{side}
	{align}
	{justify}
	inline={inline || undefined}
>
	{@render children?.()}
</xtyle-grid>

<script lang="ts">
	import "@xtyle/core/elements/grid.js";
	import type { Snippet } from "svelte";

	type GridAlign = "start" | "center" | "end" | "stretch";

	interface Props {
		gap?: number;
		columns?: number;
		minColWidth?: string;
		align?: GridAlign;
		justify?: GridAlign;
		inline?: boolean;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { gap = 4, columns, minColWidth, align, justify, inline = false, children, ...rest }: Props = $props();
</script>

<xtyle-grid {...rest} {gap} {columns} min-col-width={minColWidth} {align} {justify} inline={inline || undefined}>
	{@render children?.()}
</xtyle-grid>

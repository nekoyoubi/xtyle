<script lang="ts">
	import "@xtyle/core/elements/stat.js";
	import type { Snippet } from "svelte";
	import { STAT_TRENDS, STAT_SENTIMENTS, STAT_ALIGNS, SIZES } from "@xtyle/core";

	type StatTrend = (typeof STAT_TRENDS)[number];
	type StatSentiment = (typeof STAT_SENTIMENTS)[number];
	type StatAlign = (typeof STAT_ALIGNS)[number];
	type Size = (typeof SIZES)[number];

	interface Props {
		label?: string;
		delta?: string;
		trend?: StatTrend;
		/** The delta's color reading. Omit to derive it from `trend` (up→positive, down→negative, flat→neutral). */
		sentiment?: StatSentiment;
		caption?: string;
		size?: Size;
		align?: StatAlign;
		inline?: boolean;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		label,
		delta,
		trend = "flat",
		sentiment,
		caption,
		size = "md",
		align = "start",
		inline = false,
		children,
		...rest
	}: Props = $props();
</script>

<xtyle-stat {...rest} {label} {delta} {trend} {sentiment} {caption} {size} {align} inline={inline || undefined}>
	{@render children?.()}
</xtyle-stat>

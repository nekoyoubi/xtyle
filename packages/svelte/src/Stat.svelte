<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";

	type StatTrend = "up" | "down" | "flat";
	type StatSentiment = "positive" | "negative" | "neutral";
	type StatAlign = "start" | "center";
	type Size = "sm" | "md" | "lg";

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

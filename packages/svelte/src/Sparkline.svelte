<script lang="ts">
	import "./register.js";
	import type { SparklineVariant, SparklineTone } from "@xoji/core";

	interface Props {
		values?: number[];
		variant?: SparklineVariant;
		tone?: SparklineTone;
		showEnd?: boolean;
		min?: number;
		max?: number;
		label?: string;
		/** Any other attribute (`title`, `id`, `style`, `data-*`, `aria-*`, …) passes through. */
		[key: string]: unknown;
	}

	let {
		values = [],
		variant = "line",
		tone = "accent",
		showEnd = true,
		min,
		max,
		label,
		...rest
	}: Props = $props();

	let host: (HTMLElement & { values: number[] }) | undefined = $state();

	$effect(() => {
		if (host) host.values = values;
	});
</script>

<xoji-sparkline
	bind:this={host}
	{...rest}
	{variant}
	{tone}
	show-end={showEnd ? undefined : "false"}
	min={min ?? undefined}
	max={max ?? undefined}
	{label}
></xoji-sparkline>

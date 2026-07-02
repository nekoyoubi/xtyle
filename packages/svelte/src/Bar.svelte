<script lang="ts">
	import "./register.js";
	import type { BarSeries, BarScheme } from "@xoji/core";

	interface Props {
		series?: BarSeries[];
		categories?: string[];
		scheme?: BarScheme;
		reverse?: boolean;
		colorBy?: "series" | "category";
		orientation?: "vertical" | "horizontal";
		stacked?: boolean;
		showValues?: boolean;
		legend?: boolean;
		height?: number;
		label?: string;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		series = [],
		categories = [],
		scheme = "accents",
		reverse = false,
		colorBy,
		orientation = "vertical",
		stacked = false,
		showValues = false,
		legend = true,
		height = 320,
		label,
		...rest
	}: Props = $props();

	let host:
		| (HTMLElement & { series: BarSeries[]; categories: string[]; scheme: BarScheme })
		| undefined = $state();

	$effect(() => {
		if (!host) return;
		host.series = series;
		host.categories = categories;
		host.scheme = scheme;
	});
</script>

<xoji-bar
	bind:this={host}
	{...rest}
	reverse={reverse || undefined}
	color-by={colorBy}
	orientation={orientation === "horizontal" ? "horizontal" : undefined}
	stacked={stacked || undefined}
	show-values={showValues || undefined}
	legend={legend ? undefined : "false"}
	{height}
	{label}
></xoji-bar>

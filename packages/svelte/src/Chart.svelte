<script lang="ts">
	import "@xtyle/core/elements/chart.js";
	import type { ChartSeries, ChartScheme, ChartVariant, ChartCurve, ChartXScale } from "@xtyle/core";

	interface Props {
		series?: ChartSeries[];
		scheme?: ChartScheme;
		reverse?: boolean;
		variant?: ChartVariant;
		curve?: ChartCurve;
		markers?: boolean;
		xScale?: ChartXScale;
		/** An explicit `[start, end]` for the x axis instead of the data's own extent. */
		domain?: [number | string, number | string];
		/** A sliding window in ms ending at now, for a live time-domain feed. */
		window?: number;
		yMin?: number;
		yMax?: number;
		xTicks?: number;
		yTicks?: number;
		xLabel?: string;
		yLabel?: string;
		legend?: boolean;
		height?: number;
		label?: string;
		/** Make the plot actionable: a click or Enter at the cursor fires `select`. */
		selectable?: boolean;
		/** Fired when a position is activated (only when `selectable`), carrying the x, its label, and every series' value there. */
		onselect?: (
			event: CustomEvent<{
				x: number;
				label: string;
				index: number;
				points: { series: string; value: number }[];
			}>,
		) => void;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		series = [],
		scheme = "accents",
		reverse = false,
		variant = "line",
		curve = "linear",
		markers = false,
		xScale = "auto",
		domain,
		window: windowMs,
		yMin,
		yMax,
		xTicks,
		yTicks,
		xLabel,
		yLabel,
		legend = true,
		height = 320,
		label,
		selectable = false,
		onselect,
		...rest
	}: Props = $props();

	let host: (HTMLElement & { series: ChartSeries[]; scheme: ChartScheme }) | undefined = $state();

	$effect(() => {
		if (!host) return;
		host.series = series;
		host.scheme = scheme;
	});
</script>

<xtyle-chart
	bind:this={host}
	{...rest}
	reverse={reverse || undefined}
	variant={variant === "area" ? "area" : undefined}
	curve={curve === "linear" ? undefined : curve}
	markers={markers || undefined}
	x-scale={xScale === "auto" ? undefined : xScale}
	domain={domain ? JSON.stringify(domain) : undefined}
	window={windowMs}
	y-min={yMin}
	y-max={yMax}
	x-ticks={xTicks}
	y-ticks={yTicks}
	x-label={xLabel}
	y-label={yLabel}
	legend={legend ? undefined : "false"}
	selectable={selectable || undefined}
	{onselect}
	{height}
	{label}
></xtyle-chart>

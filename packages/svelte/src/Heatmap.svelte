<script lang="ts">
	import "./register.js";
	import type { HeatmapScheme } from "@xoji/core";

	interface Props {
		values?: number[][];
		glow?: number[][];
		rows?: string[];
		cols?: string[];
		scheme?: HeatmapScheme;
		reverse?: boolean;
		max?: number;
		glowMax?: number;
		glowBlur?: number;
		glowLabel?: string;
		/** Show a color-scale key (five swatches from the ramp with 0..max endpoints) below the grid. */
		/** Cells to ring as the current / "now" marker, each a `[rowIndex, colIndex]` pair. */
		current?: number[][];
		/** Tint for the current-cell ring: a semantic tone (`success` / `danger` / `warn` / `info` / `neutral`); defaults to accent. */
		currentTone?: "success" | "danger" | "warn" | "info" | "neutral";
		/** Pulse the current-cell ring (honors `prefers-reduced-motion`). */
		currentPulse?: boolean;
		/** Per-cell hover text (same shape as `values`); overrides a cell's default readout and accessible name. */
		titles?: string[][];
		scale?: boolean;
		showValues?: boolean;
		/** Make cells actionable: each becomes a `role="button"` that fires `select` on click or Enter/Space. */
		selectable?: boolean;
		label?: string;
		/** Fired when a cell is activated (only when `selectable`), carrying the row, column, value, and indices. */
		onselect?: (
			event: CustomEvent<{ row: string; col: string; value: number; rowIndex: number; colIndex: number }>,
		) => void;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		values = [],
		glow = [],
		rows = [],
		cols = [],
		current = [],
		currentTone,
		currentPulse = false,
		titles = [],
		scheme = "accent",
		reverse = false,
		max,
		glowMax,
		glowBlur,
		glowLabel,
		scale = false,
		showValues = false,
		selectable = false,
		label,
		onselect,
		...rest
	}: Props = $props();

	let host:
		| (HTMLElement & {
				values: number[][];
				glow: number[][];
				rows: string[];
				cols: string[];
				current: number[][];
				titles: string[][];
				scheme: HeatmapScheme;
		  })
		| undefined = $state();

	$effect(() => {
		if (!host) return;
		host.values = values;
		host.glow = glow;
		host.rows = rows;
		host.cols = cols;
		host.current = current;
		host.titles = titles;
		host.scheme = scheme;
	});
</script>

<xoji-heatmap
	bind:this={host}
	{...rest}
	reverse={reverse || undefined}
	max={max ?? undefined}
	glow-max={glowMax ?? undefined}
	glow-blur={glowBlur ?? undefined}
	glow-label={glowLabel ?? undefined}
	current-tone={currentTone ?? undefined}
	current-pulse={currentPulse || undefined}
	scale={scale || undefined}
	show-values={showValues || undefined}
	selectable={selectable || undefined}
	{onselect}
	{label}
></xoji-heatmap>

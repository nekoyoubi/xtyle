<script lang="ts">
	import "./register.js";
	import type { SparklineVariant, SparklineTone, SparklineBounds, TimeSample } from "@xtyle/core";

	interface Props {
		values?: number[];
		/** Time-windowed mode: timestamped points (`at` is epoch ms or a date string) placed on a real
		 * time axis instead of even spacing. Pass alongside `window` or `domain`. */
		points?: TimeSample[];
		/** The sliding window width in ms (default 5m), ending at now; ignored when `domain` is set. */
		window?: number;
		/** An explicit `[start, end]` x-axis span (epoch ms or date strings), instead of a sliding window. */
		domain?: [number | string, number | string];
		/** Render the line as a sample-and-hold step (for on/off or discrete series). */
		step?: boolean;
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
		points,
		window: windowMs,
		domain,
		step = false,
		variant = "line",
		tone = "accent",
		showEnd = true,
		min,
		max,
		label,
		...rest
	}: Props = $props();

	let host: (HTMLElement & { values: number[]; points: unknown[] }) | undefined = $state();

	$effect(() => {
		if (!host) return;
		host.values = values;
		host.points = points ?? [];
	});
</script>

<xtyle-sparkline
	bind:this={host}
	{...rest}
	{variant}
	{tone}
	show-end={showEnd ? undefined : "false"}
	step={step || undefined}
	window={windowMs ?? undefined}
	domain={domain ? JSON.stringify(domain) : undefined}
	min={min ?? undefined}
	max={max ?? undefined}
	{label}
></xtyle-sparkline>

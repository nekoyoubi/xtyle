<script lang="ts">
	import "@xtyle/core/elements/progress.js";
	import type { Snippet } from "svelte";
	import type { FullTone as Tone, Palette } from "@xtyle/core";

	type ProgressVariant = "linear" | "circular";
	type ProgressSize = "sm" | "md" | "lg";
	type ProgressRampMode = "solid" | "gradient";

	interface Props {
		variant?: ProgressVariant;
		tone?: Tone;
		size?: ProgressSize;
		value?: number;
		min?: number;
		max?: number;
		indeterminate?: boolean;
		showValue?: boolean;
		/** How `showValue` reads: `percent` (`80%`), `value` (the raw number), or `value-max` (`80/100`). */
		valueFormat?: "percent" | "value" | "value-max";
		/** A unit appended to the `value` / `value-max` readout (e.g. `GB`); the `percent` format ignores it. */
		unit?: string;
		/** Where the `showValue` readout sits: after the bar (`end`) or laid over the fill (`inset`). */
		valuePosition?: "end" | "inset";
		/** Tint the `showValue` readout with the active tone. */
		colorizeValue?: boolean;
		/** Report `role="meter"` (a capacity measurement) instead of `role="progressbar"` (a task). */
		meter?: boolean;
		/** Color the fill by its own value along a ramp instead of a flat `tone`: a built-in palette
		 * (`intensity` / `thermal` / `severity`) or an explicit list of stop colors. */
		ramp?: Palette | string[];
		/** How a `ramp` paints: `solid` (one sampled color) or `gradient` (a pure-CSS sweep, linear only). */
		rampMode?: ProgressRampMode;
		/** Flip the ramp end for end (hot-to-cold). */
		reverse?: boolean;
		ariaLabel?: string;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		variant = "linear",
		tone = "accent",
		size = "md",
		value = 0,
		min = 0,
		max = 100,
		indeterminate = false,
		showValue = false,
		valueFormat = "percent",
		unit,
		valuePosition = "end",
		colorizeValue = false,
		meter = false,
		ramp,
		rampMode = "solid",
		reverse = false,
		ariaLabel,
		children,
		...rest
	}: Props = $props();
</script>

<xtyle-progress
	{...rest}
	{variant}
	{tone}
	{size}
	value={indeterminate ? undefined : value}
	{min}
	{max}
	indeterminate={indeterminate || undefined}
	show-value={showValue || undefined}
	value-format={valueFormat !== "percent" ? valueFormat : undefined}
	unit={unit || undefined}
	value-position={valuePosition !== "end" ? valuePosition : undefined}
	colorize-value={colorizeValue || undefined}
	meter={meter || undefined}
	aria-label={ariaLabel ?? (rest["aria-label"] as string | undefined)}
>
	{@render children?.()}
</xtyle-progress>

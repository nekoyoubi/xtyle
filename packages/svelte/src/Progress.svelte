<script lang="ts">
	import "@xtyle/core/elements/progress.js";
	import type { Snippet } from "svelte";
	import type { FullTone as Tone, Palette } from "@xtyle/core";
	import { PROGRESS_VARIANTS, PROGRESS_SIZES, PROGRESS_RAMP_MODES } from "@xtyle/core";

	type ProgressVariant = (typeof PROGRESS_VARIANTS)[number];
	type ProgressSize = (typeof PROGRESS_SIZES)[number];
	type ProgressRampMode = (typeof PROGRESS_RAMP_MODES)[number];

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
		/** The unfilled groove: `true` for the default rail, `false` to drop it (a ring reporting a window
		 * that may not exist reads better with no groove), or a tone to paint it that tone's `-bg`. */
		track?: boolean | Tone;
		/** How heavy a `circular` ring reads, independent of its diameter: a unitless number in ring units
		 * (scales with the ring) or a CSS length (`6px`) that holds its weight at any size. */
		thickness?: string | number;
		ariaLabel?: string;
		/** Custom content for the readout, filling the element's `value` slot in place of the built-in
		 * `showValue` text. Named `readout` because `value` is already the numeric prop. */
		readout?: Snippet;
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
		track = true,
		thickness,
		ariaLabel,
		readout,
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
	ramp={ramp ? (Array.isArray(ramp) ? JSON.stringify(ramp) : ramp) : undefined}
	ramp-mode={ramp && rampMode !== "solid" ? rampMode : undefined}
	reverse={reverse || undefined}
	track={track === true ? undefined : track === false ? "none" : track}
	thickness={thickness ?? undefined}
	aria-label={ariaLabel ?? (rest["aria-label"] as string | undefined)}
>
	{#if readout}<span slot="value">{@render readout()}</span>{/if}
	{@render children?.()}
</xtyle-progress>

<script lang="ts">
	import "@xtyle/core/elements/progress.js";
	import type { Snippet } from "svelte";
	import type { FullTone as Tone, Palette } from "@xtyle/core";
	import { PROGRESS_VARIANTS, PROGRESS_SIZES, PROGRESS_RAMP_MODES, PROGRESS_ORIENTS } from "@xtyle/core";

	type ProgressVariant = (typeof PROGRESS_VARIANTS)[number];
	type ProgressSize = (typeof PROGRESS_SIZES)[number];
	type ProgressRampMode = (typeof PROGRESS_RAMP_MODES)[number];
	type ProgressOrient = (typeof PROGRESS_ORIENTS)[number];

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
		/** The visible caption above the bar, distinct from `ariaLabel`, which renders nothing. Setting it
		 * alone also names the control, so the string is written once. */
		label?: string;
		/** A free-form reading on the caption line, independent of `valueFormat` (`8/20`, `even`, `46 left`). */
		reading?: string;
		/** A line of prose under the bar, explaining what the reading means. */
		note?: string;
		/** Which axis the bar fills along. `vertical` grows the indicator up the block axis natively, so a
		 * standing gauge needs no rotation. Linear only. */
		orient?: ProgressOrient;
		ariaLabel?: string;
		/** Custom content for the readout, filling the element's `value` slot in place of the built-in
		 * `showValue` text. Named `readout` because `value` is already the numeric prop. */
		readout?: Snippet;
		/** Markup for the caption's name, in place of the plain `label` string. */
		labelContent?: Snippet;
		/** Markup for the caption's reading, in place of the plain `reading` string. */
		readingContent?: Snippet;
		/** Markup for the note under the bar, in place of the plain `note` string. */
		noteContent?: Snippet;
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
		label,
		reading,
		note,
		orient = "horizontal",
		ariaLabel,
		readout,
		labelContent,
		readingContent,
		noteContent,
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
	label={label ?? undefined}
	reading={reading ?? undefined}
	note={note ?? undefined}
	orient={orient !== "horizontal" ? orient : undefined}
	aria-label={ariaLabel ?? (rest["aria-label"] as string | undefined)}
>
	{#if readout}<span slot="value">{@render readout()}</span>{/if}
	{#if labelContent}<span slot="label">{@render labelContent()}</span>{/if}
	{#if readingContent}<span slot="reading">{@render readingContent()}</span>{/if}
	{#if noteContent}<span slot="note">{@render noteContent()}</span>{/if}
	{@render children?.()}
</xtyle-progress>

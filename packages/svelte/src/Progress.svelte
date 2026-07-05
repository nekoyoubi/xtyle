<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";
	import type { FullTone as Tone } from "@xtyle/core";

	type ProgressVariant = "linear" | "circular";
	type ProgressSize = "sm" | "md" | "lg";

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
		/** Where the `showValue` readout sits: after the bar (`end`) or laid over the fill (`inset`). */
		valuePosition?: "end" | "inset";
		/** Tint the `showValue` readout with the active tone. */
		colorizeValue?: boolean;
		/** Report `role="meter"` (a capacity measurement) instead of `role="progressbar"` (a task). */
		meter?: boolean;
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
		valuePosition = "end",
		colorizeValue = false,
		meter = false,
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
	value-position={valuePosition !== "end" ? valuePosition : undefined}
	colorize-value={colorizeValue || undefined}
	meter={meter || undefined}
	aria-label={ariaLabel ?? (rest["aria-label"] as string | undefined)}
>
	{@render children?.()}
</xtyle-progress>

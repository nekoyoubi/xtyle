<script lang="ts">
	import "@xtyle/core/elements/number-input.js";
	import type { Size } from "@xtyle/core";

	interface Props {
		value?: number | string;
		min?: number;
		max?: number;
		/** A positive number, or `"any"` for unstepped free-form entry (no snapping, no precision cap). */
		step?: number | "any";
		altStep?: number;
		altDefault?: boolean;
		modifier?: "shift" | "alt" | "ctrl" | "meta";
		disabled?: boolean;
		size?: Size;
		label?: string;
		labelledby?: string;
		name?: string;
		placeholder?: string;
		oninput?: (event: Event) => void;
		onchange?: (event: Event) => void;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		value = $bindable(""),
		min,
		max,
		step,
		altStep,
		altDefault = false,
		modifier,
		disabled = false,
		size = "md",
		label,
		labelledby,
		name,
		placeholder,
		oninput,
		onchange,
		...rest
	}: Props = $props();

	function sync(event: Event) {
		const host = event.currentTarget as HTMLElement & { value: string };
		value = host.value;
	}
	function handleInput(event: Event) {
		sync(event);
		oninput?.(event);
	}
	function handleChange(event: Event) {
		sync(event);
		onchange?.(event);
	}
</script>

<xtyle-number-input
	{...rest}
	value={value === "" ? undefined : String(value)}
	min={min}
	max={max}
	step={step}
	alt-step={altStep}
	alt-default={altDefault || undefined}
	{modifier}
	disabled={disabled || undefined}
	{size}
	{label}
	labelledby={labelledby || undefined}
	{name}
	{placeholder}
	oninput={handleInput}
	onchange={handleChange}
></xtyle-number-input>

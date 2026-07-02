<script lang="ts">
	import "./register.js";
	import type { Size } from "@xoji/core";

	type TextareaResize = "none" | "vertical" | "horizontal" | "both";

	interface Props {
		label?: string;
		value?: string;
		rows?: number;
		resize?: TextareaResize;
		placeholder?: string;
		size?: Size;
		name?: string;
		disabled?: boolean;
		invalid?: boolean;
		required?: boolean;
		error?: string;
		ariaLabel?: string;
		mono?: boolean;
		onchange?: (event: Event) => void;
		oninput?: (event: Event) => void;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		label = "",
		value = $bindable(""),
		rows = 3,
		resize = "vertical",
		placeholder,
		size = "md",
		name,
		disabled = false,
		invalid = false,
		required = false,
		error = "",
		ariaLabel,
		mono = false,
		onchange,
		oninput,
		...rest
	}: Props = $props();

	function handleInput(event: Event) {
		value = (event.target as HTMLElement & { value: string }).value;
		oninput?.(event);
	}

	function handleChange(event: Event) {
		value = (event.target as HTMLElement & { value: string }).value;
		onchange?.(event);
	}
</script>

<xoji-textarea
	{...rest}
	{label}
	{value}
	rows={rows}
	{resize}
	{placeholder}
	{size}
	{name}
	disabled={disabled || undefined}
	invalid={invalid || undefined}
	required={required || undefined}
	mono={mono || undefined}
	{error}
	aria-label={ariaLabel ?? (rest["aria-label"] as string | undefined)}
	oninput={handleInput}
	onchange={handleChange}
></xoji-textarea>

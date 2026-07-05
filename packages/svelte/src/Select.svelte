<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";
	import type { Size } from "@xtyle/core";

	interface Props {
		label?: string;
		value?: string;
		size?: Size;
		name?: string;
		disabled?: boolean;
		invalid?: boolean;
		required?: boolean;
		error?: string;
		ariaLabel?: string;
		onchange?: (event: Event) => void;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		label = "",
		value = $bindable(""),
		size = "md",
		name,
		disabled = false,
		invalid = false,
		required = false,
		error = "",
		ariaLabel,
		onchange,
		children,
		...rest
	}: Props = $props();

	function handleChange(event: Event) {
		value = (event.target as HTMLElement & { value: string }).value;
		onchange?.(event);
	}
</script>

<xtyle-select
	{...rest}
	{label}
	{value}
	{size}
	{name}
	disabled={disabled || undefined}
	invalid={invalid || undefined}
	required={required || undefined}
	{error}
	aria-label={ariaLabel ?? (rest["aria-label"] as string | undefined)}
	onchange={handleChange}
>
	{@render children?.()}
</xtyle-select>

<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";
	import type { Size, FullTone as Tone } from "@xtyle/core";

	interface Props {
		checked?: boolean;
		indeterminate?: boolean;
		disabled?: boolean;
		size?: Size;
		tone?: Tone;
		name?: string;
		value?: string;
		label?: string;
		labelledby?: string;
		onchange?: (event: Event) => void;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		checked = $bindable(false),
		indeterminate = $bindable(false),
		disabled = false,
		size = "md",
		tone = "accent",
		name,
		value,
		label,
		labelledby,
		onchange,
		children,
		...rest
	}: Props = $props();

	function handleChange(event: Event) {
		const target = event.target as HTMLElement & { checked: boolean; indeterminate: boolean };
		checked = target.checked;
		indeterminate = target.indeterminate;
		onchange?.(event);
	}
</script>

<xtyle-checkbox
	{...rest}
	checked={checked || undefined}
	indeterminate={indeterminate || undefined}
	disabled={disabled || undefined}
	{size}
	{tone}
	{name}
	{value}
	{label}
	labelledby={labelledby || undefined}
	onchange={handleChange}
>
	{@render children?.()}
</xtyle-checkbox>

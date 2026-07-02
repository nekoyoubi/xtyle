<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";
	import type { Size, FullTone as Tone } from "@xoji/core";

	interface Props {
		tone?: Tone;
		size?: Size;
		name?: string;
		value?: string;
		checked?: boolean;
		disabled?: boolean;
		invalid?: boolean;
		label?: string;
		labelledby?: string;
		ariaLabel?: string;
		onchange?: (event: Event) => void;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		tone = "accent",
		size = "md",
		name,
		value,
		checked = $bindable(false),
		disabled = false,
		invalid = false,
		label,
		labelledby,
		ariaLabel,
		onchange,
		children,
		...rest
	}: Props = $props();

	function handleChange(event: Event) {
		const target = event.target as HTMLElement & { checked: boolean };
		checked = target.checked;
		onchange?.(event);
	}
</script>

<xoji-radio
	{...rest}
	{tone}
	{size}
	{name}
	{value}
	checked={checked || undefined}
	disabled={disabled || undefined}
	invalid={invalid || undefined}
	{label}
	labelledby={labelledby || undefined}
	aria-label={ariaLabel ?? (rest["aria-label"] as string | undefined)}
	onchange={handleChange}
>
	{@render children?.()}
</xoji-radio>

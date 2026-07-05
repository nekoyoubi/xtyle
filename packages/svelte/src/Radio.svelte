<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";
	import type { Size, FullTone as Tone } from "@xtyle/core";

	interface Props {
		tone?: Tone;
		size?: Size;
		name?: string;
		value?: string;
		checked?: boolean;
		/** The selected value of the radio group, for `bind:group` across radios that share a `value`. */
		group?: string;
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
		group = $bindable<string | undefined>(undefined),
		disabled = false,
		invalid = false,
		label,
		labelledby,
		ariaLabel,
		onchange,
		children,
		...rest
	}: Props = $props();

	// With `bind:group`, the group's selected value drives checked (native radio-group semantics); a
	// standalone radio keeps its own two-way `checked`.
	const isChecked = $derived(group !== undefined ? group === value : checked);

	function handleChange(event: Event) {
		const target = event.target as HTMLElement & { checked: boolean };
		if (group !== undefined) {
			if (target.checked && value !== undefined) group = value;
		} else {
			checked = target.checked;
		}
		onchange?.(event);
	}
</script>

<xtyle-radio
	{...rest}
	{tone}
	{size}
	{name}
	{value}
	checked={isChecked || undefined}
	disabled={disabled || undefined}
	invalid={invalid || undefined}
	{label}
	labelledby={labelledby || undefined}
	aria-label={ariaLabel ?? (rest["aria-label"] as string | undefined)}
	onchange={handleChange}
>
	{@render children?.()}
</xtyle-radio>

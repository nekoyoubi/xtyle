<script lang="ts">
	import "@xtyle/core/elements/button.js";
	import type { Snippet } from "svelte";
	import type { ButtonVariant, ButtonAlign, Size, FullTone } from "@xtyle/core";

	type ButtonSize = Size | "xs";

	interface Props {
		variant?: ButtonVariant;
		tone?: FullTone;
		size?: ButtonSize;
		align?: ButtonAlign;
		type?: "button" | "submit" | "reset";
		href?: string;
		disabled?: boolean;
		loading?: boolean;
		block?: boolean;
		iconOnly?: boolean;
		pressed?: boolean;
		selected?: boolean;
		/** Set false to keep the control out of sequential focus navigation. */
		focusable?: boolean;
		ariaLabel?: string;
		onclick?: (event: MouseEvent) => void;
		iconStart?: Snippet;
		iconEnd?: Snippet;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		variant = "solid",
		tone = "accent",
		size = "md",
		align = "center",
		type = "button",
		href,
		disabled = false,
		loading = false,
		block = false,
		iconOnly = false,
		pressed,
		selected,
		focusable,
		ariaLabel,
		onclick,
		iconStart,
		iconEnd,
		children,
		...rest
	}: Props = $props();

	const blocked = $derived(disabled || loading);
</script>

<xtyle-button
	{...rest}
	{variant}
	{tone}
	{size}
	{align}
	{type}
	href={href && !blocked ? href : undefined}
	disabled={disabled || undefined}
	loading={loading || undefined}
	block={block || undefined}
	icon-only={iconOnly || undefined}
	pressed={pressed === undefined ? undefined : String(pressed)}
	selected={selected === undefined ? undefined : String(selected)}
	focusable={focusable === false ? "false" : undefined}
	aria-label={ariaLabel ?? (rest["aria-label"] as string | undefined)}
	{onclick}
>
	{#if iconStart}<span slot="icon-start">{@render iconStart()}</span>{/if}
	{@render children?.()}
	{#if iconEnd}<span slot="icon-end">{@render iconEnd()}</span>{/if}
</xtyle-button>

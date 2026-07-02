<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";
	import type { ButtonVariant, ButtonAlign, Size, FullTone } from "@xoji/core";

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
		ariaLabel,
		onclick,
		iconStart,
		iconEnd,
		children,
		...rest
	}: Props = $props();

	const blocked = $derived(disabled || loading);
</script>

<xoji-button
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
	aria-label={ariaLabel ?? (rest["aria-label"] as string | undefined)}
	{onclick}
>
	{#if iconStart}<span slot="icon-start">{@render iconStart()}</span>{/if}
	{@render children?.()}
	{#if iconEnd}<span slot="icon-end">{@render iconEnd()}</span>{/if}
</xoji-button>

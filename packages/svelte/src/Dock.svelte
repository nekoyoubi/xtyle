<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";
	import type { Size, FullTone as Tone } from "@xoji/core";

	type DockSide = "left" | "right";

	interface Props {
		side?: DockSide;
		size?: Size;
		tone?: Tone;
		reverseEdge?: boolean;
		edgeWidth?: "thin" | "thick" | "bold";
		nav?: boolean;
		label?: string;
		ariaLabel?: string;
		hideHeader?: boolean;
		header?: Snippet;
		footer?: Snippet;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		side = "left",
		size = "md",
		tone,
		reverseEdge = false,
		edgeWidth,
		nav = false,
		label,
		ariaLabel,
		hideHeader = false,
		header,
		footer,
		children,
		...rest
	}: Props = $props();
</script>

<xoji-dock
	{...rest}
	{side}
	{size}
	{tone}
	reverse-edge={reverseEdge || undefined}
	edge-width={edgeWidth}
	nav={nav || undefined}
	{label}
	aria-label={ariaLabel ?? (rest["aria-label"] as string | undefined)}
	hide-header={hideHeader || undefined}
>
	{#if header}<span slot="header">{@render header()}</span>{/if}
	{@render children?.()}
	{#if footer}<span slot="footer">{@render footer()}</span>{/if}
</xoji-dock>

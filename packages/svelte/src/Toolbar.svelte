<script lang="ts">
	import "@xtyle/core/elements/toolbar.js";
	import type { Snippet } from "svelte";
	import type { Size } from "@xtyle/core";

	interface Props {
		heading?: string;
		href?: string;
		size?: Size;
		landmark?: boolean;
		sticky?: boolean;
		bare?: boolean;
		start?: Snippet;
		center?: Snippet;
		end?: Snippet;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		heading,
		href,
		size = "md",
		landmark = false,
		sticky = false,
		bare = false,
		start,
		center,
		end,
		children,
		...rest
	}: Props = $props();
</script>

<xtyle-toolbar
	{...rest}
	{heading}
	{href}
	{size}
	landmark={landmark || undefined}
	sticky={sticky || undefined}
	bare={bare || undefined}
>
	{#if start}<span slot="start">{@render start()}</span>{/if}
	{@render children?.()}
	{#if center}<span slot="center">{@render center()}</span>{/if}
	{#if end}<span slot="end">{@render end()}</span>{/if}
</xtyle-toolbar>

<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";

	interface Props {
		href?: string;
		target?: string;
		rel?: string;
		interactive?: boolean;
		overlay?: boolean;
		compact?: boolean;
		header?: Snippet;
		footer?: Snippet;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		href,
		target,
		rel,
		interactive = true,
		overlay = false,
		compact = false,
		header,
		footer,
		children,
		...rest
	}: Props = $props();
</script>

<xtyle-card-link
	{...rest}
	{href}
	{target}
	{rel}
	interactive={interactive ? "true" : "false"}
	overlay={overlay || undefined}
	compact={compact || undefined}
>
	{#if header}<span slot="header">{@render header()}</span>{/if}
	{@render children?.()}
	{#if footer}<span slot="footer">{@render footer()}</span>{/if}
</xtyle-card-link>

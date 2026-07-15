<script lang="ts">
	import "@xtyle/core/elements/mobile-shell.js";
	import type { Snippet } from "svelte";

	interface Props {
		/** The app bar's title. Named `heading` rather than `title`, which the DOM already owns (the native tooltip). */
		heading?: string;
		/** The `id` of the `<main>` column, so a skip link can target it. */
		mainId?: string;
		/** A mark rendered before the heading, e.g. a logo. */
		brand?: Snippet;
		/** The bar's trailing controls. */
		actions?: Snippet;
		/** The bottom nav, usually a `BottomNav`. */
		nav?: Snippet;
		/** The scrolling content column. */
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { heading, mainId = "main", brand, actions, nav, children, ...rest }: Props = $props();
</script>

<xtyle-mobile-shell {...rest} {heading} main-id={mainId === "main" ? undefined : mainId}>
	{#if brand}<span slot="brand">{@render brand()}</span>{/if}
	{#if actions}<span slot="actions">{@render actions()}</span>{/if}
	{@render children?.()}
	{#if nav}<span slot="nav">{@render nav()}</span>{/if}
</xtyle-mobile-shell>

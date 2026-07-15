<script lang="ts">
	import "@xtyle/core/elements/spotlight.js";
	import type { Snippet } from "svelte";
	import type { SpotlightShape, SpotlightArrow, SpotlightPulse } from "@xtyle/core";

	interface Props {
		/** A CSS selector for the element to isolate. */
		target?: string;
		open?: boolean;
		shape?: SpotlightShape;
		padding?: number;
		radius?: number;
		/** How dark the veil goes, 0–1. */
		dim?: number;
		/** How far the page behind the veil blurs, in px. Costs a compositor layer the size of the viewport. */
		blur?: number;
		placement?: "top" | "right" | "bottom" | "left";
		heading?: string;
		arrow?: SpotlightArrow;
		pulse?: SpotlightPulse;
		scrollIntoView?: boolean;
		/** Makes the veil and Escape inert. Leave the actions slot a way out. */
		noDismiss?: boolean;
		closeLabel?: string;
		noCloseButton?: boolean;
		onopen?: (event: Event) => void;
		onclose?: (event: Event) => void;
		/** The user asked to leave — the veil, Escape, or the dismiss button. */
		ondismiss?: (event: Event) => void;
		actions?: Snippet;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		target,
		open = $bindable(false),
		shape = "auto",
		padding = 8,
		radius,
		dim,
		blur,
		placement = "bottom",
		heading,
		arrow = "bounce",
		pulse = "none",
		scrollIntoView = false,
		noDismiss = false,
		closeLabel,
		noCloseButton = false,
		onopen,
		onclose,
		ondismiss,
		actions,
		children,
		...rest
	}: Props = $props();

	function handleDismiss(event: Event) {
		open = false;
		ondismiss?.(event);
	}
</script>

<xtyle-spotlight
	{...rest}
	{target}
	open={open || undefined}
	{shape}
	{padding}
	{radius}
	{dim}
	{blur}
	{placement}
	{heading}
	{arrow}
	pulse={pulse === "none" ? undefined : pulse}
	scroll-into-view={scrollIntoView || undefined}
	no-dismiss={noDismiss || undefined}
	close-label={closeLabel}
	no-close-button={noCloseButton || undefined}
	{onopen}
	{onclose}
	ondismiss={handleDismiss}
>
	{@render children?.()}
	{#if actions}<span slot="actions">{@render actions()}</span>{/if}
</xtyle-spotlight>

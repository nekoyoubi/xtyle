<script lang="ts">
	import "@xtyle/core/elements/tour.js";
	import type { Snippet } from "svelte";
	import type { SpotlightShape, SpotlightArrow, SpotlightPulse } from "@xtyle/core";

	interface Props {
		/** A CSS selector for the element this step isolates. */
		target?: string;
		heading?: string;
		placement?: "top" | "right" | "bottom" | "left";
		shape?: SpotlightShape;
		padding?: number;
		radius?: number;
		pulse?: SpotlightPulse;
		arrow?: SpotlightArrow;
		dim?: number;
		blur?: number;
		scrollIntoView?: boolean;
		noDismiss?: boolean;
		children?: Snippet;
		/** Any other attribute passes through to the element. */
		[key: string]: unknown;
	}

	let {
		target,
		heading,
		placement,
		shape,
		padding,
		radius,
		pulse,
		arrow,
		dim,
		blur,
		scrollIntoView = false,
		noDismiss = false,
		children,
		...rest
	}: Props = $props();
</script>

<xtyle-tour-step
	{...rest}
	{target}
	{heading}
	{placement}
	{shape}
	{padding}
	{radius}
	{pulse}
	{arrow}
	{dim}
	{blur}
	scroll-into-view={scrollIntoView || undefined}
	no-dismiss={noDismiss || undefined}
>
	{@render children?.()}
</xtyle-tour-step>

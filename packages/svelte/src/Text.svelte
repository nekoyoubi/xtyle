<script lang="ts">
	import "@xtyle/core/elements/text.js";
	import type { Snippet } from "svelte";
	import type { FullTone } from "@xtyle/core";

	type TextAs = "p" | "span";
	type TextSize = "xs" | "sm" | "body" | "lg";
	type TextWeight = "normal" | "medium" | "semibold" | "bold";
	type TextLeading = "tight" | "snug" | "loose";
	type TextTone = "default" | "muted" | "subtle" | FullTone;

	interface Props {
		as?: TextAs;
		size?: TextSize;
		weight?: TextWeight;
		leading?: TextLeading;
		tone?: TextTone;
		mono?: boolean;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		as = "p",
		size = "body",
		weight = "normal",
		leading = "snug",
		tone = "default",
		mono = false,
		children,
		...rest
	}: Props = $props();
</script>

<xtyle-text {...rest} {as} {size} {weight} {leading} {tone} mono={mono || undefined}>
	{@render children?.()}
</xtyle-text>

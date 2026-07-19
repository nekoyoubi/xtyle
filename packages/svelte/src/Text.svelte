<script lang="ts">
	import "@xtyle/core/elements/text.js";
	import type { Snippet } from "svelte";
	import type { FullTone } from "@xtyle/core";
	import { TEXT_TAGS, TEXT_SIZES, TEXT_WEIGHTS, TEXT_LEADINGS } from "@xtyle/core";

	type TextAs = (typeof TEXT_TAGS)[number];
	type TextSize = (typeof TEXT_SIZES)[number];
	type TextWeight = (typeof TEXT_WEIGHTS)[number];
	type TextLeading = (typeof TEXT_LEADINGS)[number];
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

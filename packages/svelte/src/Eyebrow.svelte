<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";
	import type { FullTone } from "@xoji/core";

	type EyebrowTag = "p" | "span" | "div";
	type EyebrowTone = "muted" | "subtle" | FullTone;
	type EyebrowTracking = "normal" | "wide";

	interface Props {
		as?: EyebrowTag;
		tone?: EyebrowTone;
		tracking?: EyebrowTracking;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { as = "p", tone = "accent", tracking = "normal", children, ...rest }: Props = $props();
</script>

<xoji-eyebrow {...rest} {as} {tone} {tracking}>
	{@render children?.()}
</xoji-eyebrow>

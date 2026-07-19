<script lang="ts">
	import "@xtyle/core/elements/eyebrow.js";
	import type { Snippet } from "svelte";
	import type { FullTone } from "@xtyle/core";
	import { EYEBROW_TAGS, EYEBROW_TRACKINGS } from "@xtyle/core";

	type EyebrowTag = (typeof EYEBROW_TAGS)[number];
	type EyebrowTone = "muted" | "subtle" | FullTone;
	type EyebrowTracking = (typeof EYEBROW_TRACKINGS)[number];

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

<xtyle-eyebrow {...rest} {as} {tone} {tracking}>
	{@render children?.()}
</xtyle-eyebrow>

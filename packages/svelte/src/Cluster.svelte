<script lang="ts">
	import "@xtyle/core/elements/cluster.js";
	import type { Snippet } from "svelte";
	import { CLUSTER_ALIGNS, CLUSTER_JUSTIFIES } from "@xtyle/core";

	type ClusterAlign = (typeof CLUSTER_ALIGNS)[number];
	type ClusterJustify = (typeof CLUSTER_JUSTIFIES)[number];

	interface Props {
		gap?: number;
		align?: ClusterAlign;
		justify?: ClusterJustify;
		nowrap?: boolean;
		inline?: boolean;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { gap = 2, align, justify, nowrap = false, inline = false, children, ...rest }: Props = $props();
</script>

<xtyle-cluster {...rest} {gap} {align} {justify} nowrap={nowrap || undefined} inline={inline || undefined}>
	{@render children?.()}
</xtyle-cluster>

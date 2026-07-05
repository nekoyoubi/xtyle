<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";

	type ClusterAlign = "start" | "center" | "end" | "stretch" | "baseline";
	type ClusterJustify = "start" | "center" | "end" | "between" | "around" | "evenly";

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

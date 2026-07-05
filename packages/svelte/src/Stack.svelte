<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";

	type StackAlign = "start" | "center" | "end" | "stretch" | "baseline";
	type StackJustify = "start" | "center" | "end" | "between" | "around" | "evenly";

	interface Props {
		gap?: number;
		align?: StackAlign;
		justify?: StackJustify;
		inline?: boolean;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { gap = 4, align, justify, inline = false, children, ...rest }: Props = $props();
</script>

<xtyle-stack {...rest} {gap} {align} {justify} inline={inline || undefined}>
	{@render children?.()}
</xtyle-stack>

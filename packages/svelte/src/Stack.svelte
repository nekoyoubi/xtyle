<script lang="ts">
	import "@xtyle/core/elements/stack.js";
	import type { Snippet } from "svelte";
	import { STACK_ALIGNS, STACK_JUSTIFIES } from "@xtyle/core";

	type StackAlign = (typeof STACK_ALIGNS)[number];
	type StackJustify = (typeof STACK_JUSTIFIES)[number];

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

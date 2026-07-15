<script lang="ts">
	import "@xtyle/core/elements/steps.js";
	import type { Snippet } from "svelte";

	interface Props {
		/** Zero-based index of the current step. */
		current?: number;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { current = 0, children, ...rest }: Props = $props();
</script>

<xtyle-steps {...rest} current={current}>
	{@render children?.()}
</xtyle-steps>

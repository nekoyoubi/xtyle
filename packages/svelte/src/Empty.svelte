<script lang="ts">
	import "@xtyle/core/elements/empty.js";
	import type { Snippet } from "svelte";

	interface Props {
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { children, ...rest }: Props = $props();
</script>

<xtyle-empty {...rest}>
	{@render children?.()}
</xtyle-empty>

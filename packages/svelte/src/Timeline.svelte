<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";

	interface Props {
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { children, ...rest }: Props = $props();
</script>

<xtyle-timeline {...rest}>
	{@render children?.()}
</xtyle-timeline>

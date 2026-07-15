<script lang="ts">
	import "@xtyle/core/elements/kbd.js";
	import type { Snippet } from "svelte";
	import type { FullTone as KbdTone } from "@xtyle/core";

	type KbdSize = "sm" | "md" | "lg";

	interface Props {
		size?: KbdSize;
		tone?: KbdTone;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { size = "md", tone, children, ...rest }: Props = $props();
</script>

<xtyle-kbd {...rest} {size} {tone}>
	{@render children?.()}
</xtyle-kbd>

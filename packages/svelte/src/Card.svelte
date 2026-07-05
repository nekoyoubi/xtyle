<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";
	import type { FullTone as Tone } from "@xtyle/core";

	interface Props {
		overlay?: boolean;
		interactive?: boolean;
		action?: boolean;
		compact?: boolean;
		tone?: Tone;
		header?: Snippet;
		footer?: Snippet;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { overlay = false, interactive = false, action = false, compact = false, tone, header, footer, children, ...rest }: Props = $props();
</script>

<xtyle-card {...rest} overlay={overlay || undefined} interactive={interactive || undefined} action={action || undefined} compact={compact || undefined} {tone}>
	{#if header}<span slot="header">{@render header()}</span>{/if}
	{@render children?.()}
	{#if footer}<span slot="footer">{@render footer()}</span>{/if}
</xtyle-card>

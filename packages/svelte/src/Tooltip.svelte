<script lang="ts">
	import "@xtyle/core/elements/tooltip.js";
	import type { Snippet } from "svelte";
	import { TOOLTIP_PLACEMENTS } from "@xtyle/core";

	type Placement = (typeof TOOLTIP_PLACEMENTS)[number];

	interface Props {
		text?: string;
		placement?: Placement;
		open?: boolean;
		tone?: string;
		variant?: "soft" | "solid";
		mode?: "hint" | "rich";
		size?: "sm" | "md";
		children?: Snippet;
		content?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { text, placement = "top", open = $bindable(false), tone, variant, mode, size, content, children, ...rest }: Props =
		$props();
</script>

<xtyle-tooltip {...rest} {text} {placement} open={open || undefined} {tone} {variant} {mode} {size}>
	{@render children?.()}
	{#if content}<span slot="content">{@render content()}</span>{/if}
</xtyle-tooltip>

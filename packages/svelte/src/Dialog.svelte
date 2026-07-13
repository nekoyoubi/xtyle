<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";
	import type { DialogSize } from "@xtyle/core";

	interface Props {
		open?: boolean;
		size?: DialogSize;
		heading?: string;
		label?: string;
		labelledby?: string;
		closeLabel?: string;
		noCloseButton?: boolean;
		onclose?: (event: Event) => void;
		oncancel?: (event: Event) => void;
		header?: Snippet;
		footer?: Snippet;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		open = $bindable(false),
		size = "md",
		heading,
		label,
		labelledby,
		closeLabel,
		noCloseButton = false,
		onclose,
		oncancel,
		header,
		footer,
		children,
		...rest
	}: Props = $props();

	function handleClose(event: Event) {
		open = false;
		onclose?.(event);
	}
</script>

<xtyle-dialog
	{...rest}
	open={open || undefined}
	{size}
	{heading}
	label={label || undefined}
	labelledby={labelledby || undefined}
	close-label={closeLabel}
	no-close-button={noCloseButton || undefined}
	onclose={handleClose}
	{oncancel}
>
	{#if header}<span slot="header">{@render header()}</span>{/if}
	{@render children?.()}
	{#if footer}<span slot="footer">{@render footer()}</span>{/if}
</xtyle-dialog>

<script lang="ts">
	import "@xtyle/core/elements/dialog.js";
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

	let el: (HTMLElement & { showModal(): void; close(reason?: string): void }) | undefined = $state();

	/** Open it modally, the imperative half of `bind:open` for a caller that has no state to flip. */
	export function showModal(): void {
		el?.showModal();
	}

	/** Close it, optionally naming why — the reason rides the `close` event's detail. */
	export function close(reason?: string): void {
		el?.close(reason);
	}
</script>

<xtyle-dialog
	bind:this={el}
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

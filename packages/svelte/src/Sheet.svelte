<script lang="ts">
	import "@xtyle/core/elements/sheet.js";
	import type { Snippet } from "svelte";
	import type { SheetSide, SheetSize } from "@xtyle/core";

	interface Props {
		open?: boolean;
		side?: SheetSide;
		size?: SheetSize;
		/** Opens beside a live page: no scrim, no focus trap, the rest of the app still interactive. */
		nonModal?: boolean;
		heading?: string;
		label?: string;
		labelledby?: string;
		closeLabel?: string;
		noCloseButton?: boolean;
		noGrabber?: boolean;
		noSwipe?: boolean;
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
		side = "bottom",
		size = "md",
		nonModal = false,
		heading,
		label,
		labelledby,
		closeLabel,
		noCloseButton = false,
		noGrabber = false,
		noSwipe = false,
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

<xtyle-sheet
	{...rest}
	open={open || undefined}
	{side}
	{size}
	non-modal={nonModal || undefined}
	{heading}
	label={label || undefined}
	labelledby={labelledby || undefined}
	close-label={closeLabel}
	no-close-button={noCloseButton || undefined}
	no-grabber={noGrabber || undefined}
	no-swipe={noSwipe || undefined}
	onclose={handleClose}
	{oncancel}
>
	{#if header}<span slot="header">{@render header()}</span>{/if}
	{@render children?.()}
	{#if footer}<span slot="footer">{@render footer()}</span>{/if}
</xtyle-sheet>

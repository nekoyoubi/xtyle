<script lang="ts">
	import "@xtyle/core/elements/toast.js";
	import type { Snippet } from "svelte";
	import type { FullTone } from "@xtyle/core";
	type ToastSeverity = "success" | "warn" | "danger" | "info";

	type ToastVariant = "soft" | "solid";

	interface Props {
		/** Color — any semantic role, accent variant, or named hue. Defaults to the severity color. */
		tone?: FullTone;
		/** Meaning — drives the glyph + politeness, independent of color. Omit for a color-only toast. */
		severity?: ToastSeverity;
		variant?: ToastVariant;
		closable?: boolean;
		closeLabel?: string;
		actionLabel?: string;
		ondismiss?: (event: Event) => void;
		onaction?: (event: Event) => void;
		/** Overrides the built-in severity glyph. */
		icon?: Snippet;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		tone,
		severity,
		variant = "soft",
		closable = true,
		closeLabel,
		actionLabel,
		ondismiss,
		onaction,
		icon,
		children,
		...rest
	}: Props = $props();
</script>

<xtyle-toast
	{...rest}
	{tone}
	{severity}
	{variant}
	closable={String(closable)}
	close-label={closeLabel}
	action-label={actionLabel}
	{ondismiss}
	{onaction}
>
	{#if icon}<span slot="icon">{@render icon()}</span>{/if}
	{@render children?.()}
</xtyle-toast>

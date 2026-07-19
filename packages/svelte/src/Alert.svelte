<script lang="ts">
	import "@xtyle/core/elements/alert.js";
	import type { Snippet } from "svelte";
	import type { FullTone } from "@xtyle/core";
	import { ALERT_SEVERITIES, ALERT_VARIANTS } from "@xtyle/core";
	type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

	type AlertVariant = (typeof ALERT_VARIANTS)[number];

	interface Props {
		/** Color — any semantic role, accent variant, or named hue. Defaults to the severity color. */
		tone?: FullTone;
		/** Meaning — drives the glyph + politeness, independent of color. Omit for a color-only notice. */
		severity?: AlertSeverity;
		variant?: AlertVariant;
		dismissible?: boolean;
		dismissLabel?: string;
		ondismiss?: (event: CustomEvent) => void;
		title?: Snippet;
		actions?: Snippet;
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
		dismissible = false,
		dismissLabel,
		ondismiss,
		title,
		actions,
		icon,
		children,
		...rest
	}: Props = $props();
</script>

<xtyle-alert
	{...rest}
	{tone}
	{severity}
	{variant}
	dismissible={dismissible || undefined}
	dismiss-label={dismissLabel}
	{ondismiss}
>
	{#if icon}<span slot="icon">{@render icon()}</span>{/if}
	{#if title}<span slot="title">{@render title()}</span>{/if}
	{@render children?.()}
	{#if actions}<span slot="actions">{@render actions()}</span>{/if}
</xtyle-alert>

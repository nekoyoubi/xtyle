<script lang="ts">
	import "@xtyle/core/elements/badge.js";
	import type { Snippet } from "svelte";
	import type { FullTone as BadgeTone, Size } from "@xtyle/core";

	type BadgeVariant = "solid" | "soft" | "outline";

	interface Props {
		variant?: BadgeVariant;
		tone?: BadgeTone;
		size?: Size;
		dot?: boolean;
		pulse?: boolean | "slow" | "fast";
		count?: string | number;
		removable?: boolean;
		removeLabel?: string;
		onremove?: (event: MouseEvent) => void;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		variant = "soft",
		tone = "neutral",
		size = "md",
		dot = false,
		pulse,
		count,
		removable = false,
		removeLabel,
		onremove,
		children,
		...rest
	}: Props = $props();
</script>

<xtyle-badge
	{...rest}
	{variant}
	{tone}
	{size}
	dot={dot || undefined}
	pulse={pulse === true ? "slow" : pulse || undefined}
	count={count !== undefined && count !== null && count !== "" ? String(count) : undefined}
	removable={removable || undefined}
	remove-label={removeLabel}
	onclick={onremove
		? (event: MouseEvent) => {
				const target = event.target as HTMLElement;
				if (target.closest(".xtyle-badge__remove")) onremove(event);
			}
		: undefined}
>
	{@render children?.()}
</xtyle-badge>

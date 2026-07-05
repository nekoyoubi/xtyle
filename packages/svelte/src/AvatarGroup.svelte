<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";

	type AvatarGroupSize = "sm" | "md" | "lg" | "xl";
	type AvatarGroupSpacing = "snug" | "normal" | "loose";

	interface Props {
		size?: AvatarGroupSize;
		spacing?: AvatarGroupSpacing;
		/** How many avatars beyond the shown ones to summarize as a trailing `+N` chip. */
		overflow?: number;
		/** Accessible name for the group (a list of people). */
		label?: string;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through. */
		[key: string]: unknown;
	}

	let { size, spacing, overflow, label, children, ...rest }: Props = $props();
</script>

<xoji-avatar-group
	{...rest}
	{size}
	{spacing}
	overflow={overflow ?? undefined}
	{label}
>
	{@render children?.()}
</xoji-avatar-group>

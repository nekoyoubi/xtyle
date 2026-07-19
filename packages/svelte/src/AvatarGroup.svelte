<script lang="ts">
	import "@xtyle/core/elements/avatar-group.js";
	import type { Snippet } from "svelte";
	import { AVATAR_GROUP_SIZES, AVATAR_GROUP_SPACINGS } from "@xtyle/core";

	type AvatarGroupSize = (typeof AVATAR_GROUP_SIZES)[number];
	type AvatarGroupSpacing = (typeof AVATAR_GROUP_SPACINGS)[number];

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

<xtyle-avatar-group
	{...rest}
	{size}
	{spacing}
	overflow={overflow ?? undefined}
	{label}
>
	{@render children?.()}
</xtyle-avatar-group>

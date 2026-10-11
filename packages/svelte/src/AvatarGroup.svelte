<script lang="ts">
	import "@xtyle/core/elements/avatar-group.js";
	import type { Snippet } from "svelte";
	import { AVATAR_GROUP_SIZES, AVATAR_GROUP_SPACINGS, AVATAR_GROUP_LAYOUTS, AVATAR_GROUP_STACKS } from "@xtyle/core";

	type AvatarGroupSize = (typeof AVATAR_GROUP_SIZES)[number];
	type AvatarGroupSpacing = (typeof AVATAR_GROUP_SPACINGS)[number];
	type AvatarGroupLayout = (typeof AVATAR_GROUP_LAYOUTS)[number];
	type AvatarGroupStack = (typeof AVATAR_GROUP_STACKS)[number];

	interface Props {
		size?: AvatarGroupSize;
		spacing?: AvatarGroupSpacing;
		/** How the items sit: `overlap` (the default), `row`, `wrap`, or a `lattice` that nests diamonds edge to edge. */
		layout?: AvatarGroupLayout;
		/** Which end of the group draws on top where items overlap: `end` (the default) or `start`. */
		stack?: AvatarGroupStack;
		/** How many avatars beyond the shown ones to summarize as a trailing `+N` chip. */
		overflow?: number;
		/** Accessible name for the group (a list of people). */
		label?: string;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through. */
		[key: string]: unknown;
	}

	let { size, spacing, layout, stack, overflow, label, children, ...rest }: Props = $props();
</script>

<xtyle-avatar-group
	{...rest}
	{size}
	{spacing}
	{layout}
	{stack}
	overflow={overflow ?? undefined}
	{label}
>
	{@render children?.()}
</xtyle-avatar-group>

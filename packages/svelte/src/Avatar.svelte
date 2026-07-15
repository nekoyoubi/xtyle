<script lang="ts">
	import "@xtyle/core/elements/avatar.js";
	import type { Snippet } from "svelte";
	import type { FullTone as BadgeTone, Tone } from "@xtyle/core";

	type AvatarSize = "sm" | "md" | "lg" | "xl";
	type AvatarShape = "circle" | "square";

	interface Props {
		src?: string;
		alt?: string;
		/** The person the avatar stands for: supplies the fallback initials when there is no image and
		 * nothing slotted, and names the avatar when no `alt` is given. */
		userName?: string;
		tone?: BadgeTone;
		size?: AvatarSize;
		shape?: AvatarShape;
		status?: Tone;
		statusLabel?: string;
		/** Breathe the status dot for a live / online presence: a bare `true` pulses slow, `"fast"` quick. */
		pulse?: boolean | "slow" | "fast";
		icon?: Snippet;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		src,
		alt,
		userName,
		tone = "neutral",
		size = "md",
		shape = "circle",
		status,
		statusLabel,
		pulse,
		icon,
		children,
		...rest
	}: Props = $props();
</script>

<xtyle-avatar
	{...rest}
	{src}
	{alt}
	user-name={userName}
	{tone}
	{size}
	{shape}
	{status}
	status-label={statusLabel}
	pulse={pulse === true ? "" : pulse || undefined}
>
	{#if icon}<span slot="icon">{@render icon()}</span>{/if}
	{@render children?.()}
</xtyle-avatar>

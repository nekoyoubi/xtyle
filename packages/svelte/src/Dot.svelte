<script lang="ts">
	import "@xtyle/core/elements/dot.js";
	import type { FullTone as Tone } from "@xtyle/core";

	type DotSize = "sm" | "md" | "lg";
	type DotPulse = "slow" | "fast";

	interface Props {
		tone?: Tone;
		size?: DotSize;
		pulse?: DotPulse;
		ping?: boolean;
		glow?: boolean;
		color?: string;
		label?: string;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		tone = "neutral",
		size = "md",
		pulse,
		ping = false,
		glow = false,
		color,
		label,
		...rest
	}: Props = $props();
</script>

<xtyle-dot
	{...rest}
	{tone}
	{size}
	pulse={pulse || undefined}
	ping={ping || undefined}
	glow={glow || undefined}
	color={color || undefined}
	label={label || undefined}
></xtyle-dot>

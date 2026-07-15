<script lang="ts">
	import "@xtyle/core/elements/rating.js";
	import type { Size } from "@xtyle/core";

	interface Props {
		value?: number;
		max?: number;
		size?: Size;
		/** The icon to rate with: `star` (default), any functional glyph, or a mark spec (`taco--…`). */
		icon?: string;
		/** Read-only display (fixed, fractional). Omit for an interactive slider (focusable, click / keys). */
		readonly?: boolean;
		/** Snap interactive input to half steps. */
		allowHalf?: boolean;
		/** The series scheme a colorful mark draws its palette from. */
		colors?: string;
		/** Fill tone for a monochrome icon: a register hue (`accent`, `success`, `red`, …). */
		tone?: string;
		/** Form field name; when set, the value posts through a hidden input. */
		name?: string;
		/** Accessible label (also the no-JS fallback text). */
		label?: string;
		/** Any other attribute (`title`, `id`, `data-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { value = 0, max = 5, size, icon, readonly, allowHalf, colors, tone, name, label, ...rest }: Props = $props();
</script>

<xtyle-rating
	{...rest}
	value={value}
	max={max}
	{size}
	{icon}
	{colors}
	{tone}
	{name}
	{label}
	readonly={readonly || undefined}
	allowhalf={allowHalf || undefined}>{label ?? `${value} out of ${max} stars`}</xtyle-rating>

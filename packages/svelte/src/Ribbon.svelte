<script lang="ts">
	import "@xtyle/core/elements/ribbon.js";
	import type { FullTone as Tone } from "@xtyle/core";
	import { RIBBON_CORNERS, RIBBON_SIZES, RIBBON_VARIANTS } from "@xtyle/core";

	type RibbonCorner = (typeof RIBBON_CORNERS)[number];
	type RibbonSize = (typeof RIBBON_SIZES)[number];
	type RibbonVariant = (typeof RIBBON_VARIANTS)[number];

	interface Props {
		tone?: Tone;
		corner?: RibbonCorner;
		size?: RibbonSize;
		variant?: RibbonVariant;
		color?: string;
		textColor?: string;
		label?: string;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		tone = "accent",
		corner = "top-right",
		size = "md",
		variant = "solid",
		color,
		textColor,
		label,
		...rest
	}: Props = $props();
</script>

<xtyle-ribbon
	{...rest}
	{tone}
	{corner}
	{size}
	{variant}
	color={color || undefined}
	text-color={textColor || undefined}
	label={label || undefined}
></xtyle-ribbon>

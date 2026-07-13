<script lang="ts">
	import "./register.js";
	import type { QrEcLevel, QrModuleShape, QrMode, QrIconSize } from "@xtyle/core";

	interface Props {
		data?: string;
		mode?: QrMode;
		ecLevel?: QrEcLevel;
		icon?: string;
		logo?: string;
		iconSize?: QrIconSize;
		iconScale?: number;
		iconOverlay?: boolean;
		iconOutline?: boolean;
		moduleShape?: QrModuleShape;
		frame?: boolean;
		caption?: string;
		modeToggle?: boolean;
		size?: number;
		quietZone?: number;
		label?: string;
		/** Any other attribute (`id`, `style`, `class`, `data-*`, `aria-*`, …) passes through. */
		[key: string]: unknown;
	}

	let {
		data = "",
		mode = "theme",
		ecLevel = "M",
		icon,
		logo,
		iconSize,
		iconScale,
		iconOverlay = false,
		iconOutline = false,
		moduleShape = "square",
		frame = false,
		caption,
		modeToggle = false,
		size = 200,
		quietZone = 4,
		label,
		...rest
	}: Props = $props();
</script>

<xtyle-qr
	{...rest}
	{data}
	{mode}
	ec-level={ecLevel}
	{icon}
	{logo}
	icon-size={iconSize}
	icon-scale={iconScale}
	icon-overlay={iconOverlay || undefined}
	icon-outline={iconOutline || undefined}
	module-shape={moduleShape}
	frame={frame || undefined}
	{caption}
	mode-toggle={modeToggle || undefined}
	{size}
	quiet-zone={quietZone}
	{label}
></xtyle-qr>

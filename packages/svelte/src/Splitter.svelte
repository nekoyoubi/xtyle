<script lang="ts">
	import "@xtyle/core/elements/splitter.js";
	import { ORIENTATIONS, SPLITTER_SIZES } from "@xtyle/core";

	type SplitterOrientation = (typeof ORIENTATIONS)[number];
	type SplitterSize = (typeof SPLITTER_SIZES)[number];

	interface SplitterResizeDetail {
		value: number;
		orientation: SplitterOrientation;
	}

	interface Props {
		orientation?: SplitterOrientation;
		size?: SplitterSize;
		line?: boolean;
		min?: number;
		max?: number;
		step?: number;
		value: number;
		default?: number;
		disabled?: boolean;
		reversed?: boolean;
		var?: string;
		for?: string;
		label?: string;
		labelledby?: string;
		onresize?: (event: CustomEvent<SplitterResizeDetail>) => void;
		onresizeend?: (event: CustomEvent<SplitterResizeDetail>) => void;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		orientation = "vertical",
		size = "md",
		line = false,
		min = 0,
		max,
		step = 1,
		value = $bindable(0),
		default: defaultValue,
		disabled = false,
		reversed = false,
		var: varName,
		for: forId,
		label,
		labelledby,
		onresize,
		onresizeend,
		...rest
	}: Props = $props();

	function sync(event: Event) {
		const target = event.currentTarget as HTMLElement & { value: number };
		value = target.value;
	}
	function handleResize(event: Event) {
		sync(event);
		onresize?.(event as CustomEvent<SplitterResizeDetail>);
	}
	function handleResizeEnd(event: Event) {
		sync(event);
		onresizeend?.(event as CustomEvent<SplitterResizeDetail>);
	}
</script>

<xtyle-splitter
	{...rest}
	{orientation}
	{size}
	line={line || undefined}
	{min}
	max={max ?? undefined}
	{step}
	{value}
	default={defaultValue ?? undefined}
	disabled={disabled || undefined}
	reversed={reversed || undefined}
	var={varName}
	for={forId}
	{label}
	{labelledby}
	onresize={handleResize}
	onresizeend={handleResizeEnd}
></xtyle-splitter>

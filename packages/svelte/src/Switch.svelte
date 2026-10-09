<script lang="ts">
	import "@xtyle/core/elements/switch.js";
	import type { FullTone as Tone } from "@xtyle/core";
	import { SWITCH_SIZES } from "@xtyle/core";

	interface Props {
		checked?: boolean;
		disabled?: boolean;
		/** Set false to keep the control out of sequential focus navigation. */
		focusable?: boolean;
		/** Mark this as the one an app-owned keyboard cursor rests on: draws the focus ring without moving focus. */
		cursor?: boolean;
		size?: (typeof SWITCH_SIZES)[number];
		tone?: Tone;
		shape?: "pill" | "square";
		orientation?: "horizontal" | "vertical";
		reverse?: boolean;
		labelSide?: "start" | "end";
		/** Stretch into a full-width row: label at one edge, track at the other. */
		spread?: boolean;
		label?: string;
		labelledby?: string;
		onLabel?: string;
		offLabel?: string;
		name?: string;
		value?: string;
		onchange?: (event: Event) => void;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		checked = $bindable(false),
		disabled = false,
		focusable,
		cursor = false,
		size = "md",
		tone = "accent",
		shape = "pill",
		orientation = "horizontal",
		reverse = false,
		labelSide = "start",
		spread = false,
		label,
		labelledby,
		onLabel,
		offLabel,
		name,
		value,
		onchange,
		...rest
	}: Props = $props();

	let element: HTMLElement | undefined = $state();

	// INFO: Svelte routes any attribute starting with `on` to `addEventListener`, so `on-label` never
	// reaches the element as an attribute; set it directly here.
	$effect(() => {
		if (!element) return;
		if (onLabel != null) element.setAttribute("on-label", onLabel);
		else element.removeAttribute("on-label");
	});

	function handleChange(event: Event) {
		const host = event.currentTarget as HTMLElement & { checked: boolean };
		const inner = host.querySelector('[role="switch"]');
		checked = inner ? inner.getAttribute("aria-checked") === "true" : host.checked;
		onchange?.(event);
	}
</script>

<xtyle-switch
	bind:this={element}
	{...rest}
	checked={checked || undefined}
	disabled={disabled || undefined}
	focusable={focusable === false ? "false" : undefined}
	cursor={cursor || undefined}
	{size}
	{tone}
	shape={shape !== "pill" ? shape : undefined}
	orientation={orientation !== "horizontal" ? orientation : undefined}
	reverse={reverse || undefined}
	label-side={labelSide !== "start" ? labelSide : undefined}
	spread={spread || undefined}
	{label}
	labelledby={labelledby || undefined}
	off-label={offLabel}
	{name}
	{value}
	onchange={handleChange}
></xtyle-switch>

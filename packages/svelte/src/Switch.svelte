<script lang="ts">
	import "@xtyle/core/elements/switch.js";
	import type { FullTone as Tone } from "@xtyle/core";
	import { SWITCH_SIZES } from "@xtyle/core";

	interface Props {
		checked?: boolean;
		disabled?: boolean;
		size?: (typeof SWITCH_SIZES)[number];
		tone?: Tone;
		shape?: "pill" | "square";
		orientation?: "horizontal" | "vertical";
		reverse?: boolean;
		labelSide?: "start" | "end";
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
		size = "md",
		tone = "accent",
		shape = "pill",
		orientation = "horizontal",
		reverse = false,
		labelSide = "start",
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
	{size}
	{tone}
	shape={shape !== "pill" ? shape : undefined}
	orientation={orientation !== "horizontal" ? orientation : undefined}
	reverse={reverse || undefined}
	label-side={labelSide !== "start" ? labelSide : undefined}
	{label}
	labelledby={labelledby || undefined}
	off-label={offLabel}
	{name}
	{value}
	onchange={handleChange}
></xtyle-switch>

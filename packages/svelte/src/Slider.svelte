<script lang="ts">
	import "./register.js";
	import type { Size, FullTone as Tone } from "@xtyle/core";

	interface Props {
		value?: number;
		min?: number;
		max?: number;
		step?: number;
		disabled?: boolean;
		size?: Size;
		tone?: Tone;
		label?: string;
		labelledby?: string;
		name?: string;
		showValue?: boolean;
		hideLabel?: boolean;
		format?: ((value: number) => string) | null;
		oninput?: (event: Event) => void;
		onchange?: (event: Event) => void;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		value = $bindable(0),
		min = 0,
		max = 100,
		step = 1,
		disabled = false,
		size = "md",
		tone = "accent",
		label,
		labelledby,
		name,
		showValue = false,
		hideLabel = false,
		format = null,
		oninput,
		onchange,
		...rest
	}: Props = $props();

	let host: (HTMLElement & { value: number; format: ((value: number) => string) | null }) | undefined =
		$state();

	$effect(() => {
		if (host) host.format = format;
	});

	function sync(event: Event) {
		const target = event.currentTarget as HTMLElement & { value: number };
		value = target.value;
	}
	function handleInput(event: Event) {
		sync(event);
		oninput?.(event);
	}
	function handleChange(event: Event) {
		sync(event);
		onchange?.(event);
	}
</script>

<xtyle-slider
	bind:this={host}
	{...rest}
	{value}
	{min}
	{max}
	{step}
	disabled={disabled || undefined}
	{size}
	{tone}
	{label}
	labelledby={labelledby || undefined}
	{name}
	show-value={showValue || undefined}
	hide-label={hideLabel || undefined}
	oninput={handleInput}
	onchange={handleChange}
></xtyle-slider>

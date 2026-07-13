<script lang="ts">
	import "./register.js";
	import type { Size, FullTone as Tone } from "@xtyle/core";

	interface Props {
		value?: number;
		min?: number;
		max?: number;
		step?: number;
		/** The step taken while the modifier is held (a coarser or finer jump); defaults to `step * 10`. */
		altStep?: number;
		/** Invert the modifier so the alt step is the unmodified default and `step` needs the modifier. */
		altDefault?: boolean;
		/** Which key toggles between `step` and `altStep` for keyboard and drag. */
		modifier?: "shift" | "alt" | "ctrl" | "meta";
		/** Let a typed value exceed `min`/`max`: the thumb pins at the edge while the true value is kept. */
		overflow?: boolean;
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
		altStep,
		altDefault = false,
		modifier = "shift",
		overflow = false,
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

	let host:
		| (HTMLElement & {
				value: number;
				format: ((value: number) => string) | null;
				altStep: number;
				altDefault: boolean;
				modifier: "shift" | "alt" | "ctrl" | "meta";
				overflow: boolean;
		  })
		| undefined = $state();

	// `format` is a function and `alt-step` / `modifier` don't survive Svelte's custom-element attribute
	// pass (a hyphen is dropped, a getter-only name takes the property path), so set them on the element
	// directly — the setters reflect to the attributes the element observes.
	$effect(() => {
		if (!host) return;
		host.format = format;
		if (altStep !== undefined) host.altStep = altStep;
		host.altDefault = altDefault;
		host.modifier = modifier;
		host.overflow = overflow;
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

<!-- `min`/`max`/`step` are set before `value`: the element clamps a set value against its current
	 bounds, so on mount an initial value beyond the element's default range (max 100) would be pinned to
	 that default unless the real bounds land first. -->
<xtyle-slider
	bind:this={host}
	{...rest}
	{min}
	{max}
	{step}
	{value}
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

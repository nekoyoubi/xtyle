<script lang="ts">
	import "./register.js";

	type ColorFormat = "hex" | "rgb" | "hsl" | "oklch" | "lab" | "lch" | "oklab" | "cmyk";

	interface Props {
		value?: string;
		format?: ColorFormat;
		modes?: string;
		channels?: string;
		snap?: string;
		plane?: boolean;
		trigger?: boolean;
		swatches?: string;
		harmony?: string;
		contrastAgainst?: string;
		alpha?: boolean;
		disabled?: boolean;
		label?: string;
		labelledby?: string;
		name?: string;
		oninput?: (event: Event) => void;
		onchange?: (event: Event) => void;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		value = $bindable("#5b8cff"),
		format,
		modes,
		channels,
		snap,
		plane = false,
		trigger = false,
		swatches,
		harmony,
		contrastAgainst,
		alpha = false,
		disabled = false,
		label,
		labelledby,
		name,
		oninput,
		onchange,
		...rest
	}: Props = $props();

	function sync(event: Event) {
		const host = event.currentTarget as HTMLElement & { value: string };
		value = host.value;
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

<xtyle-color-picker
	{...rest}
	{value}
	format={format || undefined}
	modes={modes || undefined}
	channels={channels || undefined}
	snap={snap || undefined}
	plane={plane || undefined}
	trigger={trigger || undefined}
	swatches={swatches || undefined}
	harmony={harmony || undefined}
	contrast-against={contrastAgainst || undefined}
	alpha={alpha || undefined}
	disabled={disabled || undefined}
	{label}
	labelledby={labelledby || undefined}
	{name}
	oninput={handleInput}
	onchange={handleChange}
></xtyle-color-picker>

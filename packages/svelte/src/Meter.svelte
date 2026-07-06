<script lang="ts">
	import "./register.js";

	interface Props {
		value?: number;
		max?: number;
		low?: number;
		high?: number;
		optimum?: number;
		unit?: string;
		/** Label text and accessible name (also the no-JS fallback). */
		label?: string;
		/** Any other attribute (`title`, `id`, `data-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { value = 0, max = 100, low, high, optimum, unit, label, ...rest }: Props = $props();
</script>

<xtyle-meter {...rest} value={value} max={max} {low} {high} {optimum} {unit} {label}>{label ?? ""}</xtyle-meter>

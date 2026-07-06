<script lang="ts">
	import "./register.js";

	interface Props {
		value?: number;
		max?: number;
		size?: "sm" | "md" | "lg";
		/** Accessible label (also the no-JS fallback text). */
		label?: string;
		/** Any other attribute (`title`, `id`, `data-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { value = 0, max = 5, size, label, ...rest }: Props = $props();
</script>

<xtyle-rating {...rest} value={value} max={max} {size} {label}>{label ?? ""}</xtyle-rating>

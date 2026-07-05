<script lang="ts">
	import "./register.js";

	type SwatchSize = "sm" | "md" | "lg";

	interface SwatchSelectDetail {
		color: string | null;
		label: string | null;
		value: string | null;
	}

	interface Props {
		color: string;
		label?: string;
		value?: string;
		size?: SwatchSize;
		interactive?: boolean;
		selected?: boolean;
		details?: boolean;
		onselect?: (event: CustomEvent<SwatchSelectDetail>) => void;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		color,
		label,
		value,
		size = "md",
		interactive = false,
		selected = false,
		details = false,
		onselect,
		...rest
	}: Props = $props();
</script>

<xtyle-swatch
	{...rest}
	{color}
	{label}
	{value}
	{size}
	interactive={interactive || undefined}
	selected={selected || undefined}
	details={details || undefined}
	onselect={onselect as EventListener | undefined}
></xtyle-swatch>

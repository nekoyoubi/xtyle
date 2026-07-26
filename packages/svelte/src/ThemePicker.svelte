<script lang="ts">
	import "@xtyle/core/elements/theme-picker.js";
	import type { PickerTheme } from "@xtyle/core/elements";

	interface Props {
		themes?: PickerTheme[];
		value?: string;
		label?: string;
		open?: boolean;
		swatches?: boolean;
		minColWidth?: string;
		empty?: string;
		onpick?: (detail: { value: string; theme: PickerTheme | null }) => void;
		/** Any other attribute (`id`, `class`, `data-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { themes, value, label, swatches = false,
		open = false, minColWidth, empty, onpick, ...rest }: Props = $props();
</script>

<xtyle-theme-picker
	{...rest}
	themes={themes ?? undefined}
	value={value || undefined}
	label={label || undefined}
	swatches={swatches || undefined}
	open={open || undefined}
	min-col-width={minColWidth || undefined}
	empty={empty || undefined}
	onxtyle:theme-pick={onpick ? (event: Event) => onpick((event as CustomEvent).detail) : undefined}
></xtyle-theme-picker>

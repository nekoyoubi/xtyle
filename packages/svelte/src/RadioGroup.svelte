<script lang="ts">
	import "@xtyle/core/elements/radio.js";
	import type { Snippet } from "svelte";

	interface Props {
		orientation?: "vertical" | "horizontal";
		label?: string;
		labelledby?: string;
		disabled?: boolean;
		ariaLabel?: string;
		onchange?: (event: Event) => void;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		orientation = "vertical",
		label,
		labelledby,
		disabled = false,
		ariaLabel,
		onchange,
		children,
		...rest
	}: Props = $props();
</script>

<xtyle-radio-group
	{...rest}
	{orientation}
	{label}
	labelledby={labelledby || undefined}
	disabled={disabled || undefined}
	aria-label={ariaLabel ?? (rest["aria-label"] as string | undefined)}
	{onchange}
>
	{@render children?.()}
</xtyle-radio-group>

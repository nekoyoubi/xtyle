<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";
	import type { FullTone as Tone, Size } from "@xtyle/core";

	interface Props {
		label?: string;
		labelledby?: string;
		tone?: Tone;
		size?: Size;
		disabled?: boolean;
		/** Keep the heading checkbox but stop the automatic all/some/none roll-up — you drive its state. */
		manual?: boolean;
		ariaLabel?: string;
		onchange?: (event: Event) => void;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		label,
		labelledby,
		tone = "accent",
		size = "md",
		disabled = false,
		manual = false,
		ariaLabel,
		onchange,
		children,
		...rest
	}: Props = $props();
</script>

<xtyle-checkbox-group
	{...rest}
	{label}
	labelledby={labelledby || undefined}
	{tone}
	{size}
	disabled={disabled || undefined}
	manual={manual || undefined}
	aria-label={ariaLabel ?? (rest["aria-label"] as string | undefined)}
	{onchange}
>
	{@render children?.()}
</xtyle-checkbox-group>

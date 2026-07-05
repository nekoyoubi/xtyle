<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";

	type TableVariant = "default" | "striped" | "bordered";
	type TableSize = "normal" | "compact";

	interface Props {
		variant?: TableVariant;
		size?: TableSize;
		hover?: boolean;
		sticky?: boolean;
		ariaLabel?: string;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		variant = "default",
		size = "normal",
		hover = false,
		sticky = false,
		ariaLabel,
		children,
		...rest
	}: Props = $props();
</script>

<xtyle-table
	{...rest}
	{variant}
	{size}
	hover={hover || undefined}
	sticky={sticky || undefined}
	aria-label={ariaLabel ?? (rest["aria-label"] as string | undefined)}
>
	{@render children?.()}
</xtyle-table>

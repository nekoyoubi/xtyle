<script lang="ts">
	import "@xtyle/core/elements/link.js";
	import type { Snippet } from "svelte";

	type LinkVariant = "default" | "muted" | "quiet";

	interface Props {
		variant?: LinkVariant;
		href?: string;
		target?: string;
		rel?: string;
		externalIcon?: boolean;
		ariaLabel?: string;
		onclick?: (event: MouseEvent) => void;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { variant = "default", href, target, rel, externalIcon, ariaLabel, onclick, children, ...rest }: Props = $props();
</script>

<xtyle-link
	{...rest}
	{variant}
	{href}
	{target}
	{rel}
	external-icon={externalIcon === undefined ? undefined : String(externalIcon)}
	aria-label={ariaLabel ?? (rest["aria-label"] as string | undefined)}
	{onclick}
>
	{@render children?.()}
</xtyle-link>

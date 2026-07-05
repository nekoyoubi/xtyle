<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";

	interface Props {
		label?: string;
		autoplay?: boolean;
		interval?: number;
		loop?: boolean;
		controls?: boolean;
		dots?: boolean;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		label,
		autoplay = false,
		interval,
		loop = false,
		controls = true,
		dots = true,
		children,
		...rest
	}: Props = $props();
</script>

<xtyle-carousel
	{...rest}
	{label}
	{interval}
	autoplay={autoplay ? "" : undefined}
	loop={loop ? "" : undefined}
	controls={controls ? undefined : "false"}
	dots={dots ? undefined : "false"}
>
	{@render children?.()}
</xtyle-carousel>

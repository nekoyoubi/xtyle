<script lang="ts">
	import "@xtyle/core/elements/statusbar.js";
	import type { Snippet } from "svelte";

	type OverflowChange = CustomEvent<{ hidden: HTMLElement[]; visible: HTMLElement[] }>;

	interface Props {
		live?: boolean;
		label?: string;
		overflow?: "clip" | "wrap" | "scroll" | "collapse";
		manualOverflow?: boolean;
		separated?: boolean;
		onOverflowChange?: (event: OverflowChange) => void;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		live = false,
		label,
		overflow = "clip",
		manualOverflow = false,
		separated = false,
		onOverflowChange,
		children,
		...rest
	}: Props = $props();

	let host: HTMLElement | undefined = $state();

	$effect(() => {
		if (!host || !onOverflowChange) return;
		const handler = (event: Event) => onOverflowChange(event as OverflowChange);
		host.addEventListener("overflow-change", handler);
		return () => host?.removeEventListener("overflow-change", handler);
	});
</script>

<xtyle-statusbar
	{...rest}
	bind:this={host}
	live={live || undefined}
	label={label}
	overflow={overflow}
	manual-overflow={manualOverflow || undefined}
	separated={separated || undefined}
>
	{@render children?.()}
</xtyle-statusbar>

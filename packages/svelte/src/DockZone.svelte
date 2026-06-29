<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";
	import type { DockNode } from "@xoji/core/elements";

	type LayoutChange = CustomEvent<{ layout: DockNode | null }>;

	interface Props {
		/** Restore a persisted layout tree. Read the current one back from `onLayoutChange`. */
		layout?: DockNode | null;
		onLayoutChange?: (event: LayoutChange) => void;
		children?: Snippet;
		/** Any other attribute (`style`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { layout, onLayoutChange, children, ...rest }: Props = $props();

	let host: (HTMLElement & { layout: DockNode | null }) | undefined = $state();

	// `layout` is a tree object, not an attribute, so set it as a property on the live element.
	$effect(() => {
		if (host && layout !== undefined) host.layout = layout;
	});

	$effect(() => {
		if (!host || !onLayoutChange) return;
		const handler = (event: Event) => onLayoutChange(event as LayoutChange);
		host.addEventListener("layout-change", handler);
		return () => host?.removeEventListener("layout-change", handler);
	});
</script>

<xoji-dock-zone {...rest} bind:this={host}>
	{@render children?.()}
</xoji-dock-zone>

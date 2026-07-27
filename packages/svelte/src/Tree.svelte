<script lang="ts">
	import "@xtyle/core/elements/tree.js";
	import type { Size, TreeNode } from "@xtyle/core";

	type TreeActionEvent = CustomEvent<{ value: string; action: string }>;

	interface Props {
		items?: TreeNode[];
		size?: Size;
		label?: string;
		labelledby?: string;
		onselect?: (event: Event) => void;
		ontoggle?: (event: Event) => void;
		/** Fires when a node's trailing action button is activated (`detail: { value, action }`). */
		ontreeaction?: (event: TreeActionEvent) => void;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		items = [],
		size = "md",
		label,
		labelledby,
		onselect,
		ontoggle,
		ontreeaction,
		...rest
	}: Props = $props();

	let el: (HTMLElement & { items?: TreeNode[] }) | undefined = $state();

	$effect(() => {
		if (el) el.items = items;
	});

	// INFO: Svelte's on… prop can't bind a hyphenated custom event, so tree-action is attached directly
	$effect(() => {
		const node = el;
		if (!node) return;
		const handler = (event: Event): void => ontreeaction?.(event as TreeActionEvent);
		node.addEventListener("tree-action", handler);
		return () => node.removeEventListener("tree-action", handler);
	});
</script>

<xtyle-tree
	{...rest}
	bind:this={el}
	{size}
	{label}
	labelledby={labelledby || undefined}
	{onselect}
	{ontoggle}
></xtyle-tree>

<script lang="ts">
	import "./register.js";
	import type { Size } from "@xtyle/core";

	interface TreeNode {
		label: string;
		value?: string;
		href?: string;
		expanded?: boolean;
		selected?: boolean;
		disabled?: boolean;
		children?: TreeNode[];
	}

	interface Props {
		items?: TreeNode[];
		size?: Size;
		label?: string;
		labelledby?: string;
		onselect?: (event: Event) => void;
		ontoggle?: (event: Event) => void;
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
		...rest
	}: Props = $props();

	let el: (HTMLElement & { items?: TreeNode[] }) | undefined = $state();

	$effect(() => {
		if (el) el.items = items;
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

<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";
	import type { Size, FullTone } from "@xtyle/core";

	interface BreadcrumbItem {
		label: string;
		href?: string;
		value?: string;
		current?: boolean;
	}

	interface Props {
		items?: BreadcrumbItem[];
		separator?: string;
		tone?: FullTone;
		size?: Size;
		label?: string;
		children?: Snippet;
		/** Fired when a valued crumb (no `href`) is activated; `detail` carries `{ value, index }`. */
		onselect?: (event: CustomEvent<{ value: string; index: number }>) => void;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { items, separator = "/", tone = "accent", size = "md", label = "Breadcrumb", children, onselect, ...rest }: Props = $props();

	const itemsAttr = $derived(items && items.length > 0 ? JSON.stringify(items) : undefined);
</script>

<xtyle-breadcrumb {...rest} {tone} {size} {separator} {label} items={itemsAttr} {onselect}>
	{@render children?.()}
</xtyle-breadcrumb>

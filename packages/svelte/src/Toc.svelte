<script lang="ts">
	import "./register.js";

	interface TocItem {
		id: string;
		label: string;
	}

	interface Props {
		items?: TocItem[];
		label?: string;
		sticky?: boolean;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { items = [], label = "On this page", sticky = false, ...rest }: Props = $props();

	const itemsJson = $derived(JSON.stringify(items));
</script>

<xtyle-toc {...rest} items={itemsJson} {label} sticky={sticky || undefined}></xtyle-toc>

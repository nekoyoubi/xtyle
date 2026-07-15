<script lang="ts">
	import "@xtyle/core/elements/pagination.js";
	import type { FullTone, Size } from "@xtyle/core";

	type PageChange = CustomEvent<{ page: number }>;

	interface Props {
		page?: number;
		total?: number;
		siblings?: number;
		boundaries?: number;
		href?: string;
		tone?: FullTone;
		size?: Size;
		label?: string;
		/** Fired when a page or control is activated in button mode (no `href`). */
		onpagechange?: (event: PageChange) => void;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		page = 1,
		total = 1,
		siblings = 1,
		boundaries = 1,
		href,
		tone = "accent",
		size = "md",
		label = "Pagination",
		onpagechange,
		...rest
	}: Props = $props();

	let host: HTMLElement | undefined = $state();

	$effect(() => {
		if (!host || !onpagechange) return;
		const handler = (event: Event) => onpagechange(event as PageChange);
		host.addEventListener("page-change", handler);
		return () => host?.removeEventListener("page-change", handler);
	});
</script>

<xtyle-pagination
	{...rest}
	bind:this={host}
	page={page}
	total={total}
	siblings={siblings}
	boundaries={boundaries}
	href={href}
	tone={tone}
	size={size}
	label={label}
></xtyle-pagination>

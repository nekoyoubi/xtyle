<script lang="ts">
	import "./register.js";

	interface BottomNavTab {
		value: string;
		label: string;
		/** A functional icon name, drawn above the label. */
		icon?: string;
		/** An optional count, e.g. unread. */
		badge?: string | number | null;
	}

	interface Props {
		tabs?: BottomNavTab[];
		/** The selected tab's `value`. Bindable: selecting a tab writes it back. */
		value?: string;
		/** The accessible name of the tablist. */
		label?: string;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { tabs = [], value = $bindable(""), label = "Sections", ...rest }: Props = $props();

	let el: HTMLElement | undefined = $state();

	// `tabs` is structured data, so it rides the element's property rather than an attribute; the
	// element re-renders its tablist off it.
	$effect(() => {
		if (!el) return;
		(el as unknown as { tabs: BottomNavTab[] }).tabs = tabs;
	});
</script>

<xtyle-bottom-nav
	{...rest}
	bind:this={el}
	{value}
	{label}
	onchange={(e: Event) => (value = (e.target as unknown as { value: string }).value)}
></xtyle-bottom-nav>

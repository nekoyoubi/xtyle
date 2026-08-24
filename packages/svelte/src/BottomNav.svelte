<script lang="ts">
	import "@xtyle/core/elements/bottom-nav.js";

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
		/** Fires when a destination is chosen. `event.detail` carries `{ value }`. */
		onchange?: (event: CustomEvent<{ value: string }>) => void;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { tabs = [], value = $bindable(""), label = "Sections", onchange, ...rest }: Props = $props();

	let el: HTMLElement | undefined = $state();

	// INFO: tabs is structured data, so it rides the element property rather than an attribute
	$effect(() => {
		if (!el) return;
		(el as unknown as { tabs: BottomNavTab[] }).tabs = tabs;
	});
	function handleChange(event: Event): void {
		value = (event.target as unknown as { value: string }).value;
		onchange?.(event as CustomEvent<{ value: string }>);
	}
</script>

<xtyle-bottom-nav
	{...rest}
	bind:this={el}
	{value}
	{label}
	onchange={handleChange}
></xtyle-bottom-nav>

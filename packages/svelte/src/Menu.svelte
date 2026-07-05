<script lang="ts">
	import "./register.js";
	import type { MenuItem } from "@xtyle/core/elements";

	interface Props {
		items?: MenuItem[];
		label?: string;
		open?: boolean;
		onselect?: (event: Event) => void;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { items = [], label, open = false, onselect, ...rest }: Props = $props();

	let el: (HTMLElement & { items?: MenuItem[]; open?: boolean }) | undefined = $state();

	$effect(() => {
		if (el) el.items = items;
	});

	$effect(() => {
		const target = el;
		if (!target) return;
		// Defer to a microtask so an `open`-by-default menu doesn't fire the element's popover
		// logic synchronously inside Svelte's mount-effect flush (which corrupts Svelte's
		// reconciliation). Post-mount toggles settle a microtask later — imperceptible.
		queueMicrotask(() => {
			target.open = open;
		});
	});
</script>

<xtyle-menu {...rest} bind:this={el} {label} {onselect}></xtyle-menu>

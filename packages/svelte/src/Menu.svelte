<script lang="ts">
	import "@xtyle/core/elements/menu.js";
	import type { MenuItem, MenuOpenAtOptions } from "@xtyle/core/elements";

	interface Props {
		items?: MenuItem[];
		label?: string;
		open?: boolean;
		/** Cursor-anchored mode: no trigger is rendered; open the menu at a point with `menu.openAt(x, y)` from a `contextmenu` handler. */
		context?: boolean;
		onselect?: (event: Event) => void;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { items = [], label, open = false, context = false, onselect, ...rest }: Props = $props();

	type MenuElement = HTMLElement & {
		items?: MenuItem[];
		open?: boolean;
		context?: boolean;
		openAt(x: number, y: number, opts?: MenuOpenAtOptions): void;
	};

	let el: MenuElement | undefined = $state();

	/** Open the menu at a point in viewport coordinates — call from a `contextmenu` handler on the surface it belongs to. */
	export function openAt(x: number, y: number, opts?: MenuOpenAtOptions): void {
		el?.openAt(x, y, opts);
	}

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

<xtyle-menu {...rest} bind:this={el} {label} context={context || undefined} {onselect}></xtyle-menu>

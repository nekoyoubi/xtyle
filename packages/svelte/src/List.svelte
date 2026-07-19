<script lang="ts">
	import "@xtyle/core/elements/list.js";
	import type { Size } from "@xtyle/core";
	import { LIST_INTERACTIONS, LIST_SELECTIONS, ORIENTATIONS } from "@xtyle/core";

	type Interaction = (typeof LIST_INTERACTIONS)[number];
	type Selection = (typeof LIST_SELECTIONS)[number];
	type Orientation = (typeof ORIENTATIONS)[number];
	type Action = { id: string; label: string; icon?: string; disabled?: boolean };
	type Item = {
		value: string;
		label: string;
		disabled?: boolean;
		lead?: string;
		trail?: string;
		selected?: boolean;
		actions?: Action[];
	};

	interface Props {
		items?: string | ReadonlyArray<string | Item>;
		interaction?: Interaction;
		selection?: Selection;
		orientation?: Orientation;
		size?: Size;
		label?: string;
		labelledby?: string;
		/** Fires on a selection change (selectable). `event.detail` carries `{ value, selected }`. */
		onchange?: (event: Event) => void;
		/** Fires when a navigational item is activated. `event.detail` carries `{ value }`. */
		onselect?: (event: Event) => void;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		items,
		interaction = "navigational",
		selection = "none",
		orientation = "vertical",
		size = "md",
		label,
		labelledby,
		onchange,
		onselect,
		...rest
	}: Props = $props();

	let host: (HTMLElement & { items: string | ReadonlyArray<string | Item> }) | undefined = $state();

	// A structured items array can't survive an attribute; set it as a property once the element exists.
	$effect(() => {
		if (host && items != null && typeof items !== "string") host.items = items;
	});
</script>

<xtyle-list
	bind:this={host}
	{...rest}
	options={typeof items === "string" ? items : undefined}
	{interaction}
	{selection}
	{orientation}
	{size}
	{label}
	labelledby={labelledby || undefined}
	onchange={onchange}
	onselect={onselect}
></xtyle-list>

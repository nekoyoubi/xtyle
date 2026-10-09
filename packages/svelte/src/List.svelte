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
		trail?: string | string[];
		description?: string;
		badge?: string | { text: string; tone?: string } | Array<string | { text: string; tone?: string }>;
		selected?: boolean;
		actions?: Action[];
		heading?: boolean;
		checked?: boolean;
		separator?: boolean;
		variant?: "solid" | "outline" | "subtle";
		trailTone?: string;
		accelerator?: string;
		tone?: string;
	};

	interface Props {
		items?: string | ReadonlyArray<string | Item>;
		interaction?: Interaction;
		selection?: Selection;
		orientation?: Orientation;
		size?: Size;
		label?: string;
		labelledby?: string;
		/** Announced after a checked row's label in place of `checked`. */
		checkedLabel?: string;
		/** Announced after an unchecked row's label in place of `not checked`. */
		uncheckedLabel?: string;
		/** Fires on a selection change (selectable). `event.detail` carries `{ value, selected }`. */
		onchange?: (event: Event) => void;
		/** Fires when an item's trailing action button is activated. `event.detail` carries `{ value, action }`. */
		onlistaction?: (event: Event) => void;
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
		checkedLabel,
		uncheckedLabel,
		onchange,
		onlistaction,
		onselect,
		...rest
	}: Props = $props();

	let host: (HTMLElement & { items: string | ReadonlyArray<string | Item> }) | undefined = $state();

	// INFO: a structured items array can't survive an attribute; set it as a property once the element exists
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
	checked-label={checkedLabel || undefined}
	unchecked-label={uncheckedLabel || undefined}
	onchange={onchange}
	onlistaction={onlistaction}
	onselect={onselect}
></xtyle-list>

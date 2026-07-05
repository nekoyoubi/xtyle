<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";
	import type { Size } from "@xtyle/core";
	import type { TabItemData, TabsVariant, TabsActivation } from "@xtyle/core/markup";

	interface Props {
		items?: TabItemData[];
		variant?: TabsVariant;
		size?: Size;
		activation?: TabsActivation;
		value?: string;
		label?: string;
		labelledby?: string;
		sticky?: boolean;
		/** Mount a panel's content only once its tab is first shown, then keep it mounted. Off by default
		 * (every panel renders up front). Reach for it when panels are heavy (an editor, a chart) or must
		 * lay out only while visible; the tab strip, roving focus, and a11y are unchanged either way. */
		lazy?: boolean;
		onchange?: (value: string) => void;
		/** The content for the active tab. Omit it for a headless tablist: the element drives `value`,
		 * roving focus, and a11y as a bare tab strip while you render the content yourself (so a
		 * persistent sidebar can live outside the panel region and keep its own state across switches). */
		panel?: Snippet<[string]>;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		items = [],
		variant = "underline",
		size = "md",
		activation = "automatic",
		value = $bindable(),
		label,
		labelledby,
		sticky = false,
		lazy = false,
		onchange,
		panel,
		...rest
	}: Props = $props();

	const headless = $derived(!panel);
	// Fall back to the first *enabled* tab, matching the element's own default selection.
	const activeKey = $derived(value ?? items.find((t) => !t.disabled)?.value ?? items[0]?.value ?? "0");
	// Keep-alive of shown panels. Must reassign the array: mutating a `$state` Set/array in place
	// doesn't re-run Svelte 5's template dependents.
	let shownKeys = $state<string[]>([]);
	$effect(() => {
		if (lazy && !shownKeys.includes(activeKey)) shownKeys = [...shownKeys, activeKey];
	});

	function handleChange(event: Event) {
		// `xtyle-tabs` dispatches `change` with `composed: true`, so a nested Tabs' change
		// bubbles up to an outer one. Only act on changes from this element, not descendants.
		if (event.target !== event.currentTarget) return;
		const next = (event as CustomEvent<{ value: string }>).detail?.value;
		if (next === undefined) return;
		value = next;
		onchange?.(next);
	}
</script>

<xtyle-tabs
	{...rest}
	{variant}
	{size}
	{activation}
	{value}
	{label}
	sticky={sticky || undefined}
	tablist={headless || undefined}
	labelledby={labelledby || undefined}
	onchange={handleChange}
>
	{#each items as tab, i (tab.value ?? i)}
		{@const key = tab.value ?? String(i)}
		<span slot="tab" value={key} disabled={tab.disabled || undefined}>{tab.label}</span>
		{#if !headless}
			<div slot="panel">{#if !lazy || shownKeys.includes(key)}{@render panel?.(key)}{/if}</div>
		{/if}
	{/each}
</xtyle-tabs>

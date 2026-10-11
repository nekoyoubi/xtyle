<script lang="ts">
	import "@xtyle/core/elements/accordion.js";
	import type { Snippet } from "svelte";
	import type { Size } from "@xtyle/core";

	interface AccordionItem {
		value: string;
		header: string;
		open?: boolean;
		disabled?: boolean;
	}

	interface Props {
		sections: AccordionItem[];
		multiple?: boolean;
		size?: Size;
		headingLevel?: 2 | 3 | 4 | 5 | 6;
		/** The roster glyph drawn as the disclosure marker. */
		chevronIcon?: string;
		ontoggle?: (event: Event) => void;
		panel: Snippet<[string]>;
		/** Rich header content for a section, in place of its `header` text. Keep it non-interactive: it renders inside the trigger. */
		header?: Snippet<[string]>;
		/** Controls on a section's header row (reorder arrows, a view switch), beside the trigger rather than inside it. */
		actions?: Snippet<[string]>;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		sections,
		multiple = false,
		size = "md",
		headingLevel,
		chevronIcon,
		ontoggle,
		panel,
		header,
		actions,
		...rest
	}: Props = $props();
</script>

<xtyle-accordion
	{...rest}
	multiple={multiple || undefined}
	{size}
	heading-level={headingLevel}
	chevron-icon={chevronIcon}
	{ontoggle}
>
	{#each sections as section (section.value)}
		<span
			slot="header"
			value={section.value}
			open={section.open || undefined}
			disabled={section.disabled || undefined}
			>{#if header}{@render header(section.value)}{:else}{section.header}{/if}</span
		>
		{#if actions}<span slot="actions">{@render actions(section.value)}</span>{/if}
		<div slot="panel">{@render panel(section.value)}</div>
	{/each}
</xtyle-accordion>

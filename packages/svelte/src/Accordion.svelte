<script lang="ts">
	import "./register.js";
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
		ontoggle?: (event: Event) => void;
		panel: Snippet<[string]>;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		sections,
		multiple = false,
		size = "md",
		headingLevel,
		ontoggle,
		panel,
		...rest
	}: Props = $props();
</script>

<xtyle-accordion
	{...rest}
	multiple={multiple || undefined}
	{size}
	heading-level={headingLevel}
	{ontoggle}
>
	{#each sections as section (section.value)}
		<span
			slot="header"
			value={section.value}
			open={section.open || undefined}
			disabled={section.disabled || undefined}>{section.header}</span>
		<div slot="panel">{@render panel(section.value)}</div>
	{/each}
</xtyle-accordion>

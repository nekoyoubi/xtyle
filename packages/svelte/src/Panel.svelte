<script lang="ts">
	import "@xtyle/core/elements/panel.js";
	import type { Snippet } from "svelte";

	type PanelVariant = "default" | "collapsible";

	interface Props {
		title?: string;
		level?: 1 | 2 | 3 | 4 | 5 | 6;
		variant?: PanelVariant;
		open?: boolean;
		scroll?: boolean;
		onToggle?: (open: boolean) => void;
		actions?: Snippet;
		footer?: Snippet;
		children?: Snippet;
		/** Any other attribute (`title` is taken; `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		title,
		level = 2,
		variant = "default",
		open = $bindable(false),
		scroll = false,
		onToggle,
		actions,
		footer,
		children,
		...rest
	}: Props = $props();

	function handleToggle(event: Event) {
		open = (event.currentTarget as HTMLElement).hasAttribute("open");
		onToggle?.(open);
	}
</script>

<xtyle-panel
	{...rest}
	{title}
	level={level}
	variant={variant}
	open={open || undefined}
	scroll={scroll || undefined}
	ontoggle={handleToggle}
>
	{#if actions}<span slot="actions">{@render actions()}</span>{/if}
	{@render children?.()}
	{#if footer}<span slot="footer">{@render footer()}</span>{/if}
</xtyle-panel>

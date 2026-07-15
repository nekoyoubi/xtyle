<script lang="ts">
	import "@xtyle/core/elements/split-button.js";
	import type { Snippet } from "svelte";
	import type { MenuItem, ButtonVariant, FullTone, SplitButtonSize } from "@xtyle/core";

	interface Props {
		/** The dropdown's rows: the same `MenuItem` contract Menu speaks — actions, separators, headings. */
		items?: MenuItem[];
		variant?: ButtonVariant;
		tone?: FullTone;
		size?: SplitButtonSize;
		open?: boolean;
		disabled?: boolean;
		/** Puts the primary in flight: a spinner replaces its label and the press is blocked. The caret stays live. */
		loading?: boolean;
		/** Accessible name for the caret half. Name it for what the menu holds. */
		menuLabel?: string;
		block?: boolean;
		/** The primary's native button type — `submit` makes the default action submit the surrounding form. */
		type?: string;
		/** The primary was pressed. The caret's own click never reaches this. */
		onclick?: (event: MouseEvent) => void;
		/** A row was chosen from the dropdown: `event.detail` carries `{ value, label }`. */
		onselect?: (event: CustomEvent<{ value: string; label: string }>) => void;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		items = [],
		variant = "solid",
		tone = "accent",
		size = "md",
		open = $bindable(false),
		disabled = false,
		loading = false,
		menuLabel,
		block = false,
		type = "button",
		onclick,
		onselect,
		children,
		...rest
	}: Props = $props();

	let el: HTMLElement | undefined = $state();

	// the menu closes on paths the binding never sees (a light dismiss, a chosen row), so `open` follows the
	// element rather than the element following `open`
	$effect(() => {
		const node = el;
		if (!node) return;
		const sync = () => {
			const now = node.hasAttribute("open");
			if (now !== open) open = now;
		};
		const observer = new MutationObserver(sync);
		observer.observe(node, { attributes: true, attributeFilter: ["open"] });
		return () => observer.disconnect();
	});
</script>

<xtyle-split-button
	bind:this={el}
	{...rest}
	{variant}
	{tone}
	{size}
	{type}
	items={JSON.stringify(items)}
	open={open || undefined}
	disabled={disabled || undefined}
	loading={loading || undefined}
	block={block || undefined}
	menu-label={menuLabel}
	{onclick}
	onselect={onselect}
>
	{@render children?.()}
</xtyle-split-button>

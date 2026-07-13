<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";

	interface Props {
		skipLink?: string | boolean;
		leftSize?: number | string;
		rightSize?: number | string;
		/** Make the left / right rail user-resizable: a drag handle on its inner edge, arrow-key nudges
		 * (`Shift` for a bigger step, `Home` / `End` to jump to the bounds), and a double-click reset to
		 * `leftSize` / `rightSize`. The main column reflows as the rail changes. */
		leftResizable?: boolean;
		rightResizable?: boolean;
		/** Clamp for the resizable rails, in px. */
		leftMin?: number;
		leftMax?: number;
		rightMin?: number;
		rightMax?: number;
		toolbar?: Snippet;
		left?: Snippet;
		right?: Snippet;
		statusbar?: Snippet;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		skipLink,
		leftSize,
		rightSize,
		leftResizable,
		rightResizable,
		leftMin,
		leftMax,
		rightMin,
		rightMax,
		toolbar,
		left,
		right,
		statusbar,
		children,
		...rest
	}: Props = $props();

	const skipAttr = $derived(skipLink === true ? "" : skipLink || undefined);
	const railAttr = (v: number | string | undefined) =>
		v === undefined ? undefined : typeof v === "number" ? String(v) : v;
	const flag = (v: boolean | undefined) => (v ? true : undefined);
</script>

<xtyle-app-shell
	{...rest}
	skip-link={skipAttr}
	left-size={railAttr(leftSize)}
	right-size={railAttr(rightSize)}
	left-resizable={flag(leftResizable)}
	right-resizable={flag(rightResizable)}
	left-min={railAttr(leftMin)}
	left-max={railAttr(leftMax)}
	right-min={railAttr(rightMin)}
	right-max={railAttr(rightMax)}
>
	{#if toolbar}<div slot="toolbar">{@render toolbar()}</div>{/if}
	{#if left}<div slot="left">{@render left()}</div>{/if}
	{@render children?.()}
	{#if right}<div slot="right">{@render right()}</div>{/if}
	{#if statusbar}<div slot="statusbar">{@render statusbar()}</div>{/if}
</xtyle-app-shell>

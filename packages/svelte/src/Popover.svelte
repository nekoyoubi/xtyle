<script lang="ts">
	import "@xtyle/core/elements/popover.js";
	import type { Snippet } from "svelte";
	import type {
		PopoverAlign,
		PopoverFocus,
		PopoverOpenOptions,
		PopoverPanelRole,
		PopoverPlacement,
	} from "@xtyle/core/elements";

	interface Props {
		open?: boolean;
		placement?: PopoverPlacement;
		align?: PopoverAlign;
		gap?: number;
		/** Draw the arrow — a real node in the fragment, tethered to the anchor's center. */
		arrow?: boolean;
		/** Modal posture: the panel opens as a modal `<dialog>`, so the platform makes the page behind it inert, and
		 * clicks outside are swallowed rather than passed through. */
		modal?: boolean;
		/** Drop the panel's padding so slotted content reaches its edges (a list, a menu, an image). */
		flush?: boolean;
		/** The `id` of an element elsewhere in the document that anchors and toggles the popover. */
		for?: string;
		label?: string;
		labelledby?: string;
		panelRole?: PopoverPanelRole;
		focusOnOpen?: PopoverFocus;
		noCloseOnSelect?: boolean;
		noLightDismiss?: boolean;
		onopen?: (event: Event) => void;
		onclose?: (event: CustomEvent<{ reason: string }>) => void;
		/** The consumer's own trigger. Omit it for a popover opened only through `openAt` / `openFrom`. */
		trigger?: Snippet;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		open = $bindable(false),
		placement = "bottom",
		align = "center",
		gap,
		arrow = false,
		modal = false,
		flush = false,
		for: anchorFor,
		label,
		labelledby,
		panelRole = "dialog",
		focusOnOpen,
		noCloseOnSelect = false,
		noLightDismiss = false,
		onopen,
		onclose,
		trigger,
		children,
		...rest
	}: Props = $props();

	type PopoverElement = HTMLElement & {
		open?: boolean;
		show(opts?: PopoverOpenOptions): void;
		openAt(x: number, y: number, opts?: PopoverOpenOptions): void;
		openFrom(anchor: HTMLElement, opts?: PopoverOpenOptions): void;
		hide(reason?: string, returnFocus?: boolean): void;
		toggle(): void;
		reposition(): void;
	};

	let el: PopoverElement | undefined = $state();

	/** Open against the declared anchor — the slotted trigger, or the `for` element. */
	export function show(opts?: PopoverOpenOptions): void {
		el?.show(opts);
	}

	/** Open at a point in viewport coordinates — from a click or `contextmenu` handler. */
	export function openAt(x: number, y: number, opts?: PopoverOpenOptions): void {
		el?.openAt(x, y, opts);
	}

	/** Open against any element — the hook for a component that owns its own trigger. */
	export function openFrom(anchor: HTMLElement, opts?: PopoverOpenOptions): void {
		el?.openFrom(anchor, opts);
	}

	/** Close the panel, handing focus back to wherever it was when the panel opened. */
	export function hide(): void {
		el?.hide();
	}

	/** Re-place the panel against its current anchor, after its content changed size. */
	export function reposition(): void {
		el?.reposition();
	}

	function handleClose(event: Event): void {
		open = false;
		onclose?.(event as CustomEvent<{ reason: string }>);
	}

	function handleOpen(event: Event): void {
		open = true;
		onopen?.(event);
	}

	$effect(() => {
		const target = el;
		if (!target) return;
		// Defer to a microtask so an `open`-by-default popover doesn't fire the element's popover
		// logic synchronously inside Svelte's mount-effect flush (which corrupts Svelte's
		// reconciliation). Post-mount toggles settle a microtask later — imperceptible.
		queueMicrotask(() => {
			target.open = open;
		});
	});
</script>

<xtyle-popover
	{...rest}
	bind:this={el}
	{placement}
	{align}
	gap={gap != null ? String(gap) : undefined}
	arrow={arrow || undefined}
	modal={modal || undefined}
	flush={flush || undefined}
	for={anchorFor}
	{label}
	{labelledby}
	panel-role={panelRole}
	focus-on-open={focusOnOpen}
	no-close-on-select={noCloseOnSelect || undefined}
	no-light-dismiss={noLightDismiss || undefined}
	onopen={handleOpen}
	onclose={handleClose}
>
	{#if trigger}<span slot="trigger">{@render trigger()}</span>{/if}
	{@render children?.()}
</xtyle-popover>

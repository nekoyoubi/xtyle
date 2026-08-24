<script lang="ts">
	import "@xtyle/core/elements/command-palette.js";
	import type { CommandItem, CommandScorer } from "@xtyle/core/elements";

	interface Props {
		/** Every command the palette can run, unfiltered — the palette does the filtering. */
		items?: CommandItem[];
		open?: boolean;
		/** The live filter text. Writable, so a palette whose commands take arguments can complete into it. */
		query?: string;
		/** The ranking override. Return `null` to drop an item, `{ score, indices? }` to keep it. */
		scorer?: CommandScorer;
		/** A document-wide chord that opens the palette: `mod+k` (⌘ on Apple, Ctrl elsewhere). */
		hotkey?: string;
		label?: string;
		placeholder?: string;
		emptyText?: string;
		/** Ids of recently-run commands, most recent first — seed them from your own store. */
		recent?: string[];
		recentLabel?: string;
		recentLimit?: number;
		/** Don't track or surface recently-run commands at all. */
		noRecent?: boolean;
		/** A `localStorage` key to persist recents under. */
		storageKey?: string;
		/** Drop the keyboard legend along the bottom edge. */
		noFooter?: boolean;
		/** Keep the palette open after a command runs. */
		noCloseOnSelect?: boolean;
		completeFirst?: boolean;
		onselect?: (event: CustomEvent<{ id: string; label: string; item: CommandItem; index: number; query: string }>) => void;
		/** The filter text changed — `event.detail` carries `{ query }`. */
		onquery?: (event: CustomEvent<{ query: string }>) => void;
		onopen?: (event: Event) => void;
		onclose?: (event: CustomEvent<{ reason: string }>) => void;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		items = [],
		open = $bindable(false),
		query = $bindable(""),
		scorer,
		hotkey,
		label,
		placeholder,
		emptyText,
		recent,
		recentLabel,
		recentLimit,
		noRecent = false,
		storageKey,
		noFooter = false,
		noCloseOnSelect = false,
		completeFirst = false,
		onselect,
		onquery,
		onopen,
		onclose,
		...rest
	}: Props = $props();

	type PaletteElement = HTMLElement & {
		items?: CommandItem[];
		scorer?: CommandScorer | null;
		recent?: string[];
		open?: boolean;
		query?: string;
		show(): void;
		close(reason?: string): void;
		toggle(): void;
		run(id: string): void;
	};

	let el: PaletteElement | undefined = $state();

	/** Open the palette, remembering what had focus so closing can hand it back. */
	export function show(): void {
		el?.show();
	}

	/** Close the palette and return focus to wherever it came from. */
	export function close(): void {
		el?.close();
	}

	/** Open if closed, close if open — what the hotkey does. */
	export function toggle(): void {
		el?.toggle();
	}

	/** Run a command by id, exactly as selecting it would. */
	export function run(id: string): void {
		el?.run(id);
	}

	function handleQuery(event: Event): void {
		const detail = (event as CustomEvent<{ query: string }>).detail;
		query = detail?.query ?? "";
		onquery?.(event as CustomEvent<{ query: string }>);
	}

	function handleOpen(event: Event): void {
		open = true;
		onopen?.(event);
	}

	function handleClose(event: Event): void {
		open = false;
		onclose?.(event as CustomEvent<{ reason: string }>);
	}

	$effect(() => {
		if (el) el.items = items;
	});

	$effect(() => {
		if (el && scorer) el.scorer = scorer;
	});

	$effect(() => {
		if (el && recent) el.recent = recent;
	});

	$effect(() => {
		const target = el;
		const next = open;
		if (!target) return;
		// HACK: defer to a microtask so an `open`-by-default palette doesn't call `showModal()`
		// synchronously in Svelte's mount-effect flush, which corrupts Svelte's reconciliation
		queueMicrotask(() => {
			target.open = next;
		});
	});

	$effect(() => {
		const target = el;
		const next = query;
		if (!target || target.query === next) return;
		target.query = next;
	});
</script>

<xtyle-command-palette
	{...rest}
	bind:this={el}
	{hotkey}
	{label}
	{placeholder}
	empty-text={emptyText}
	recent-label={recentLabel}
	recent-limit={recentLimit != null ? String(recentLimit) : undefined}
	no-recent={noRecent || undefined}
	storage-key={storageKey}
	no-footer={noFooter || undefined}
	no-close-on-select={noCloseOnSelect || undefined}
	complete-first={completeFirst || undefined}
	onselect={onselect as unknown as (event: Event) => void}
	onquery={handleQuery}
	onopen={handleOpen}
	onclose={handleClose}
></xtyle-command-palette>

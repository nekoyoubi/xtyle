<script lang="ts">
	import "@xtyle/core/elements/tour.js";
	import type { Snippet } from "svelte";
	import type { TourProgress, SpotlightShape, SpotlightPulse, SpotlightArrow, TourSpec } from "@xtyle/core";

	interface Props {
		open?: boolean;
		index?: number;
		progress?: TourProgress;
		backLabel?: string;
		nextLabel?: string;
		doneLabel?: string;
		skipLabel?: string;
		noSkip?: boolean;
		placement?: "top" | "right" | "bottom" | "left";
		shape?: SpotlightShape;
		pulse?: SpotlightPulse;
		/** Breathing room between a target and the edge of its hole, in px. */
		padding?: number;
		/** How dark each step's veil goes, 0–1. */
		dim?: number;
		/** How far the page behind each veil blurs, in px. */
		blur?: number;
		arrow?: SpotlightArrow;
		/** Scroll each target to the middle of the viewport before its callout opens. */
		scrollIntoView?: boolean;
		noDismiss?: boolean;
		/** A whole tour as data, in place of authoring `TourStep` children. Materializes the same steps, so a
		 * spec-driven tour behaves identically to a slotted one. */
		spec?: TourSpec;
		/** Whether this tour has already been taken. The component reports `oncomplete` / `onskip` and keeps
		 * no memory of either; where that is stored is the app's decision. */
		taken?: boolean;
		/** The tour advanced to a step — `event.detail` carries `{ index, total }`. */
		/** Run before a step's target is resolved, and awaited when it returns a promise — the seam for a
		 * step that has to *make* what it points at (open a panel, select a layer). */
		beforeStep?: (index: number) => void | Promise<void>;
		/** How long to keep watching for a late target after the callout is up, in ms. */
		targetTimeout?: number;
		/** A step's target never resolved — `event.detail` carries `{ index, target }`. */
		ontargetmissing?: (event: CustomEvent<{ index: number; target: string }>) => void;
		/** The tour opened on its first step. */
		onstart?: (event: Event) => void;
		onstep?: (event: Event) => void;
		/** The last step's Done was pressed. */
		oncomplete?: (event: Event) => void;
		/** The user left the tour early. */
		onskip?: (event: Event) => void;
		/** The tour closed, for any reason. */
		onclose?: (event: Event) => void;
		children?: Snippet;
		/** Any other attribute passes through to the element. */
		[key: string]: unknown;
	}

	let {
		open = $bindable(false),
		index,
		progress = "count",
		backLabel,
		nextLabel,
		doneLabel,
		skipLabel,
		noSkip = false,
		placement,
		shape,
		pulse,
		padding,
		dim,
		blur,
		arrow,
		scrollIntoView = false,
		noDismiss = false,
		spec,
		taken = false,
		beforeStep,
		targetTimeout,
		ontargetmissing,
		onstart,
		onstep,
		oncomplete,
		onskip,
		onclose,
		children,
		...rest
	}: Props = $props();


	// INFO: `beforeStep` is a function, so it can only ride the element as a property; every other
	// prop here serializes to an attribute, which is why this is the one that needs a ref
	type TourElement = HTMLElement & {
		beforeStep?: ((index: number) => void | Promise<void>) | null;
		start(index?: number): void;
		next(): void;
		back(): void;
		go(index: number): void;
		finish(): void;
		skip(): void;
		close(): void;
	};

	let el: TourElement | undefined = $state();

	$effect(() => {
		const target = el;
		const next = beforeStep ?? null;
		if (target) target.beforeStep = next;
	});

	/** Open the tour on a step, defaulting to the first. */
	export function start(index = 0): void {
		el?.start(index);
	}

	/** Advance one step; the last step's Done is `finish`, not this. */
	export function next(): void {
		el?.next();
	}

	/** Step back one, stopping at the first. */
	export function back(): void {
		el?.back();
	}

	/** Jump to a step by index — what a picker or a resumed walkthrough needs. */
	export function go(index: number): void {
		el?.go(index);
	}

	/** Complete the tour, reporting `oncomplete`. */
	export function finish(): void {
		el?.finish();
	}

	/** Leave early, reporting `onskip`. */
	export function skip(): void {
		el?.skip();
	}

	/** Close without reporting completion or skip. */
	export function close(): void {
		el?.close();
	}

	function handleClose(event: Event) {
		open = false;
		onclose?.(event);
	}
</script>

<xtyle-tour
	{...rest}
	bind:this={el}
	open={open || undefined}
	{index}
	{progress}
	back-label={backLabel}
	next-label={nextLabel}
	done-label={doneLabel}
	skip-label={skipLabel}
	no-skip={noSkip || undefined}
	{placement}
	{shape}
	{pulse}
	padding={padding != null ? String(padding) : undefined}
	dim={dim != null ? String(dim) : undefined}
	blur={blur != null ? String(blur) : undefined}
	{arrow}
	scroll-into-view={scrollIntoView || undefined}
	no-dismiss={noDismiss || undefined}
	taken={taken || undefined}
	spec={spec ? JSON.stringify(spec) : undefined}
	target-timeout={targetTimeout != null ? String(targetTimeout) : undefined}
	ontargetmissing={ontargetmissing as unknown as (event: Event) => void}
	{onstart}
	{onstep}
	{oncomplete}
	{onskip}
	onclose={handleClose}
>
	{@render children?.()}
</xtyle-tour>

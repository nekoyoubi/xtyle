<script lang="ts">
	import "@xtyle/core/elements/reveal.js";
	import { REVEAL_BEHAVIORS, REVEAL_DIRECTIONS } from "@xtyle/core";

	type RevealDirection = (typeof REVEAL_DIRECTIONS)[number];
	type RevealBehavior = (typeof REVEAL_BEHAVIORS)[number];

	interface RevealDetail {
		direction: RevealDirection;
	}

	interface Props {
		name?: string;
		open?: RevealDirection | null;
		behavior?: RevealBehavior;
		shape?: string;
		contained?: boolean;
		/** Declare the lid a control rather than a container: `role="button"` in place of `role="group"`. Pair with `label`. */
		control?: boolean;
		bleed?: boolean;
		tone?: string;
		flickVelocity?: number;
		travel?: number | string;
		gripSize?: string;
		gripPad?: string;
		gripStyle?: "glyph" | "bar" | "dots" | "none";
		latchAt?: number | string;
		commitAt?: number | string;
		lockThreshold?: number;
		disabled?: boolean;
		label?: string;
		startBehavior?: RevealBehavior;
		startTone?: string;
		startGrip?: string;
		startGripStyle?: "glyph" | "bar" | "dots" | "none";
		endBehavior?: RevealBehavior;
		endTone?: string;
		endGrip?: string;
		endGripStyle?: "glyph" | "bar" | "dots" | "none";
		topBehavior?: RevealBehavior;
		topTone?: string;
		topGrip?: string;
		topGripStyle?: "glyph" | "bar" | "dots" | "none";
		bottomBehavior?: RevealBehavior;
		bottomTone?: string;
		bottomGrip?: string;
		bottomGripStyle?: "glyph" | "bar" | "dots" | "none";
		startLatchAt?: number | string;
		endLatchAt?: number | string;
		topLatchAt?: number | string;
		bottomLatchAt?: number | string;
		startTravel?: number | string;
		endTravel?: number | string;
		topTravel?: number | string;
		bottomTravel?: number | string;
		startCommitAt?: number | string;
		endCommitAt?: number | string;
		topCommitAt?: number | string;
		bottomCommitAt?: number | string;
		onreveal?: (event: CustomEvent<RevealDetail>) => void;
		onconceal?: (event: CustomEvent<RevealDetail>) => void;
		oncommit?: (event: CustomEvent<RevealDetail>) => void;
		children?: import("svelte").Snippet;
		start?: import("svelte").Snippet;
		end?: import("svelte").Snippet;
		top?: import("svelte").Snippet;
		bottom?: import("svelte").Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		name,
		open = $bindable(null),
		behavior,
		shape,
		contained = false,
		control = false,
		bleed = false,
		tone,
		flickVelocity,
		travel,
		gripSize,
		gripPad,
		gripStyle,
		latchAt,
		commitAt,
		lockThreshold,
		disabled = false,
		label,
		startBehavior,
		startTone,
		startGrip,
		startGripStyle,
		endBehavior,
		endTone,
		endGrip,
		endGripStyle,
		topBehavior,
		topTone,
		topGrip,
		topGripStyle,
		bottomBehavior,
		bottomTone,
		bottomGrip,
		bottomGripStyle,
		startLatchAt,
		endLatchAt,
		topLatchAt,
		bottomLatchAt,
		startTravel,
		endTravel,
		topTravel,
		bottomTravel,
		startCommitAt,
		endCommitAt,
		topCommitAt,
		bottomCommitAt,
		onreveal,
		onconceal,
		oncommit,
		children,
		start,
		end,
		top,
		bottom,
		...rest
	}: Props = $props();

	type RevealElement = HTMLElement & {
		open: RevealDirection | null;
		reveal(direction: RevealDirection): void;
		conceal(): void;
		commit(direction: RevealDirection): void;
	};

	let el: RevealElement | undefined = $state();

	/** Slide the lid open on a direction, exactly as a pull past `latchAt` does. */
	export function reveal(direction: RevealDirection): void {
		el?.reveal(direction);
	}

	/** Slide the lid back, exactly as letting go short of the threshold does. */
	export function conceal(): void {
		el?.conceal();
	}

	/**
	 * Take a direction's action and close, exactly as a full pull past `commitAt` does — the digital door
	 * for a control whose only other input is an analogue gesture, so a test harness drives the documented
	 * API instead of synthesising pointer events against internal geometry.
	 */
	export function commit(direction: RevealDirection): void {
		el?.commit(direction);
	}

	function sync(event: Event) {
		const target = event.currentTarget as HTMLElement & { open: RevealDirection | null };
		open = target.open;
	}
	function handleReveal(event: Event) {
		sync(event);
		onreveal?.(event as CustomEvent<RevealDetail>);
	}
	function handleConceal(event: Event) {
		sync(event);
		onconceal?.(event as CustomEvent<RevealDetail>);
	}
	function handleCommit(event: Event) {
		sync(event);
		oncommit?.(event as CustomEvent<RevealDetail>);
	}
</script>

<xtyle-reveal
	bind:this={el}
	{...rest}
	{name}
	open={open ?? undefined}
	{behavior}
	{shape}
	contained={contained || undefined}
	control={control || undefined}
	bleed={bleed || undefined}
	{tone}
	flick-velocity={flickVelocity ?? undefined}
	travel={travel ?? undefined}
	grip-size={gripSize}
	grip-pad={gripPad}
	grip-style={gripStyle}
	latch-at={latchAt ?? undefined}
	commit-at={commitAt ?? undefined}
	lock-threshold={lockThreshold ?? undefined}
	disabled={disabled || undefined}
	{label}
	start-behavior={startBehavior}
	start-tone={startTone}
	start-grip={startGrip}
	start-grip-style={startGripStyle}
	end-behavior={endBehavior}
	end-tone={endTone}
	end-grip={endGrip}
	end-grip-style={endGripStyle}
	top-behavior={topBehavior}
	top-tone={topTone}
	top-grip={topGrip}
	top-grip-style={topGripStyle}
	bottom-behavior={bottomBehavior}
	bottom-tone={bottomTone}
	bottom-grip={bottomGrip}
	bottom-grip-style={bottomGripStyle}
	start-latch-at={startLatchAt ?? undefined}
	end-latch-at={endLatchAt ?? undefined}
	top-latch-at={topLatchAt ?? undefined}
	bottom-latch-at={bottomLatchAt ?? undefined}
	start-travel={startTravel ?? undefined}
	end-travel={endTravel ?? undefined}
	top-travel={topTravel ?? undefined}
	bottom-travel={bottomTravel ?? undefined}
	start-commit-at={startCommitAt ?? undefined}
	end-commit-at={endCommitAt ?? undefined}
	top-commit-at={topCommitAt ?? undefined}
	bottom-commit-at={bottomCommitAt ?? undefined}
	onxtyle:reveal={handleReveal}
	onxtyle:conceal={handleConceal}
	onxtyle:reveal-commit={handleCommit}
>
	{@render children?.()}
	{#if start}<div slot="start">{@render start()}</div>{/if}
	{#if end}<div slot="end">{@render end()}</div>{/if}
	{#if top}<div slot="top">{@render top()}</div>{/if}
	{#if bottom}<div slot="bottom">{@render bottom()}</div>{/if}
</xtyle-reveal>

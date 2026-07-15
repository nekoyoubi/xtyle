<script lang="ts">
	import "@xtyle/core/elements/tour.js";
	import type { Snippet } from "svelte";
	import type { TourProgress, SpotlightShape, SpotlightPulse } from "@xtyle/core";

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
		noDismiss?: boolean;
		/** The tour advanced to a step — `event.detail` carries `{ index, total }`. */
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
		noDismiss = false,
		onstep,
		oncomplete,
		onskip,
		onclose,
		children,
		...rest
	}: Props = $props();

	function handleClose(event: Event) {
		open = false;
		onclose?.(event);
	}
</script>

<xtyle-tour
	{...rest}
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
	no-dismiss={noDismiss || undefined}
	{onstep}
	{oncomplete}
	{onskip}
	onclose={handleClose}
>
	{@render children?.()}
</xtyle-tour>

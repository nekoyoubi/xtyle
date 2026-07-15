<script lang="ts">
	import "@xtyle/core/elements/redact.js";
	import type { Snippet } from "svelte";
	import type { RedactMode, RedactReveal } from "@xtyle/core";

	interface Props {
		mode?: RedactMode;
		reveal?: RedactReveal;
		/** The blur radius in px, overriding the size-relative default. Only used by `blur` mode. */
		amount?: number;
		/** What the content is, for the cover's accessible name. */
		label?: string;
		/** Custom hint text on the cover, in place of the default eye glyph. */
		cue?: string;
		revealed?: boolean;
		/** The content came into view — the trigger, the prop, or the page-level switch. */
		onreveal?: (event: Event) => void;
		/** The content left view again. */
		onconceal?: (event: Event) => void;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		mode = "blur",
		reveal = "hover",
		amount,
		label,
		cue,
		revealed = $bindable(false),
		onreveal,
		onconceal,
		children,
		...rest
	}: Props = $props();

	function handleReveal(event: Event) {
		revealed = true;
		onreveal?.(event);
	}

	function handleConceal(event: Event) {
		revealed = false;
		onconceal?.(event);
	}
</script>

<xtyle-redact
	{...rest}
	{mode}
	{reveal}
	{amount}
	{label}
	{cue}
	revealed={revealed || undefined}
	onreveal={handleReveal}
	onconceal={handleConceal}
>
	{@render children?.()}
</xtyle-redact>

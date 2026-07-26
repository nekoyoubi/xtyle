<script lang="ts">
	import type { Snippet } from "svelte";

	interface Props {
		/** The value this segment selects; emitted on `change` and submitted with the form. */
		value: string;
		/** Accessible name for the segment, since its content is markup (an icon) rather than text. */
		label?: string;
		disabled?: boolean;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the segment. */
		[key: string]: unknown;
	}

	let { value, label, disabled = false, children, ...rest }: Props = $props();

	// INFO: Svelte rejects a literal `slot` on a component root, so pass it via the spread; this span
	// always lands inside `<xtyle-segmented>` at runtime, where the slot is valid
	const attrs = $derived({ slot: "segment", value, label, disabled: disabled || undefined, ...rest });
</script>

<span {...attrs}>{@render children?.()}</span>

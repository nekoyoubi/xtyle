<script lang="ts">
	import "@xtyle/core/elements/spinner.js";
	import type { Size, FullTone as Tone } from "@xtyle/core";

	interface Props {
		tone?: Tone;
		size?: Size;
		ariaLabel?: string;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { tone = "accent", size = "md", ariaLabel = "Loading", ...rest }: Props = $props();
</script>

<xtyle-spinner {...rest} {tone} {size} aria-label={ariaLabel ?? (rest["aria-label"] as string | undefined)}></xtyle-spinner>

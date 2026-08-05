<script lang="ts">
	import "@xtyle/core/elements/reveal-group.js";

	interface Props {
		label?: string;
		labelledby?: string;
		children?: import("svelte").Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { label, labelledby, children, ...rest }: Props = $props();
</script>

<xtyle-reveal-group {...rest} {label} {labelledby}>{@render children?.()}</xtyle-reveal-group>

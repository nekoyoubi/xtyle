<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";

	interface Props {
		lang?: string;
		code?: string;
		preload?: boolean;
		/** The copy-to-clipboard button; on by default, set `false` to drop it. */
		copy?: boolean;
		/** Soft-wrap long lines instead of scrolling them horizontally. */
		wrap?: boolean;
		/** Number each line in a counter gutter. */
		lineNumbers?: boolean;
		/** Tint chosen lines; a 1-based spec like `2`, `2,4`, or `4-6`. */
		highlight?: string;
		/** A caption header above the block, e.g. a filename. */
		caption?: string;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { lang, code, preload = false, copy = true, wrap = false, lineNumbers = false, highlight, caption, children, ...rest }: Props = $props();
</script>

<xoji-code {...rest} {lang} {code} {preload} copy={copy ? undefined : "false"} wrap={wrap || undefined} line-numbers={lineNumbers || undefined} highlight={highlight || undefined} caption={caption || undefined}>
	{@render children?.()}
</xoji-code>

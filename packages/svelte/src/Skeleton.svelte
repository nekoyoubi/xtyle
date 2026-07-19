<script lang="ts">
	import "@xtyle/core/elements/skeleton.js";
	import type { Size } from "@xtyle/core";
	import { SKELETON_SHAPES } from "@xtyle/core";

	type SkeletonShape = (typeof SKELETON_SHAPES)[number];

	interface Props {
		shape?: SkeletonShape;
		size?: Size;
		class?: string;
		style?: string;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { shape = "text", size = "md", class: extra, style, ...rest }: Props = $props();
</script>

<xtyle-skeleton {...rest} {shape} {size} class={extra} {style}></xtyle-skeleton>

<script lang="ts">
	import "@xtyle/core/elements/nine-patch.js";
	import type { Snippet } from "svelte";
	import type { NinePatchRegion } from "@xtyle/core/elements";

	type RegionMap = Partial<Record<NinePatchRegion, string>>;

	interface Props {
		src?: string;
		slice?: string;
		width?: string;
		repeat?: "stretch" | "repeat" | "round" | "space";
		fill?: boolean;
		tint?: string;
		pieces?: RegionMap;
		tints?: RegionMap;
		inset?: string;
		outset?: string;
		children?: Snippet;
		/** Any other attribute (`id`, `class`, `data-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { src, slice, width, repeat, fill = false, tint, pieces, tints, inset, outset, children, ...rest }: Props = $props();

	const json = (value: unknown): string | undefined => (value === undefined ? undefined : JSON.stringify(value));
</script>

<xtyle-nine-patch
	{...rest}
	src={src || undefined}
	slice={slice || undefined}
	width={width || undefined}
	repeat={repeat || undefined}
	fill={fill || undefined}
	tint={tint || undefined}
	pieces={json(pieces)}
	tints={json(tints)}
	inset={inset || undefined}
	outset={outset || undefined}
>
	{@render children?.()}
</xtyle-nine-patch>

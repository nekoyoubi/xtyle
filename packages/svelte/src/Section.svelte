<script lang="ts">
	import "@xtyle/core/elements/section.js";
	import type { Snippet } from "svelte";
	import type { FullTone } from "@xtyle/core";
	import { SECTION_TAGS, SECTION_VARIANTS, SECTION_PADDINGS } from "@xtyle/core";

	type SectionTag = (typeof SECTION_TAGS)[number];
	type SectionVariant = (typeof SECTION_VARIANTS)[number];
	type SectionTone = "plain" | "quiet" | FullTone;
	type SectionPadding = (typeof SECTION_PADDINGS)[number];

	interface Props {
		as?: SectionTag;
		variant?: SectionVariant;
		tone?: SectionTone;
		bordered?: boolean;
		padding?: SectionPadding;
		label?: string;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		as = "section",
		variant = "band",
		tone = "plain",
		bordered = false,
		padding = "lg",
		label,
		children,
		...rest
	}: Props = $props();
</script>

<xtyle-section {...rest} {as} {variant} {tone} {padding} {label} bordered={bordered || undefined}>
	{@render children?.()}
</xtyle-section>

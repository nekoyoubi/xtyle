<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";
	import type { FullTone } from "@xtyle/core";

	type SectionTag = "section" | "div" | "header" | "footer";
	type SectionVariant = "band" | "stage";
	type SectionTone = "plain" | "quiet" | FullTone;
	type SectionPadding = "none" | "sm" | "md" | "lg";

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

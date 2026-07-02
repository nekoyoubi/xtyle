<script lang="ts">
	import "./register.js";
	import type { PieDatum, PieScheme, PieVariant } from "@xoji/core";

	interface Props {
		data?: PieDatum[];
		scheme?: PieScheme;
		reverse?: boolean;
		variant?: PieVariant;
		showValues?: boolean;
		legend?: boolean;
		size?: number;
		label?: string;
		/** Any other attribute (`title`, `id`, `style`, `data-*`, `aria-*`, …) passes through. */
		[key: string]: unknown;
	}

	let {
		data = [],
		scheme = "skittles",
		reverse = false,
		variant = "pie",
		showValues = false,
		legend = true,
		size = 200,
		label,
		...rest
	}: Props = $props();

	let host: (HTMLElement & { data: PieDatum[]; scheme: PieScheme }) | undefined = $state();

	$effect(() => {
		if (!host) return;
		host.data = data;
		host.scheme = scheme;
	});
</script>

<xoji-pie
	bind:this={host}
	{...rest}
	{variant}
	reverse={reverse || undefined}
	show-values={showValues || undefined}
	legend={legend ? undefined : "false"}
	{size}
	{label}
></xoji-pie>

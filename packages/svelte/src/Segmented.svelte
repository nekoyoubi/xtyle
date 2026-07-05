<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";
	import type { Size, FullTone as Tone } from "@xtyle/core";

	type SegmentOption = { value: string; label?: string; disabled?: boolean; badge?: string };

	interface Props {
		value?: string;
		options?: string | ReadonlyArray<string | SegmentOption>;
		disabled?: boolean;
		size?: Size;
		tone?: Tone;
		label?: string;
		labelledby?: string;
		name?: string;
		onchange?: (event: Event) => void;
		/** `<Segment>` children for the rich-content mode (each holds an icon or other markup); they win
		 * over `options` when both are given. Omit for the plain-text `options` bar. */
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		value = $bindable(""),
		options,
		disabled = false,
		size = "md",
		tone = "accent",
		label,
		labelledby,
		name,
		onchange,
		children,
		...rest
	}: Props = $props();

	let host: (HTMLElement & { options: string | ReadonlyArray<string | SegmentOption> }) | undefined = $state();

	$effect(() => {
		if (host && options != null) host.options = options;
	});

	function handleChange(event: Event) {
		const target = event.currentTarget as HTMLElement & { value: string };
		value = target.value;
		onchange?.(event);
	}
</script>

<xtyle-segmented
	bind:this={host}
	{...rest}
	value={value || undefined}
	options={typeof options === "string" ? options : undefined}
	disabled={disabled || undefined}
	{size}
	{tone}
	{label}
	labelledby={labelledby || undefined}
	{name}
	onchange={handleChange}
>{@render children?.()}</xtyle-segmented>

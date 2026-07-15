<script lang="ts">
	import "@xtyle/core/elements/field.js";
	import type { Snippet } from "svelte";
	import type { Size } from "@xtyle/core";

	type FieldOption = { value: string; label?: string };

	interface Props {
		label?: string;
		name?: string;
		placeholder?: string;
		value?: string;
		type?: string;
		size?: Size;
		disabled?: boolean;
		readonly?: boolean;
		invalid?: boolean;
		required?: boolean;
		clearable?: boolean;
		description?: string;
		error?: string;
		ariaLabel?: string;
		options?: ReadonlyArray<string | FieldOption>;
		mono?: boolean;
		oninput?: (event: Event) => void;
		onchange?: (event: Event) => void;
		prefix?: Snippet;
		suffix?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		label = "",
		name,
		placeholder = "",
		value = $bindable(""),
		type = "text",
		size = "md",
		disabled = false,
		readonly = false,
		invalid = false,
		required = false,
		clearable = false,
		description = "",
		error = "",
		ariaLabel,
		options,
		mono = false,
		oninput,
		onchange,
		prefix,
		suffix,
		...rest
	}: Props = $props();

	let host: (HTMLElement & { options: ReadonlyArray<string | FieldOption> }) | undefined = $state();

	$effect(() => {
		if (host) host.options = options ?? [];
	});

	function handleInput(event: Event) {
		value = (event.target as HTMLElement & { value: string }).value;
		oninput?.(event);
	}
</script>

<xtyle-field
	bind:this={host}
	{...rest}
	{label}
	name={name || undefined}
	{placeholder}
	{value}
	{type}
	{size}
	disabled={disabled || undefined}
	readonly={readonly || undefined}
	invalid={invalid || undefined}
	required={required || undefined}
	clearable={clearable || undefined}
	mono={mono || undefined}
	{description}
	{error}
	aria-label={ariaLabel ?? (rest["aria-label"] as string | undefined)}
	oninput={handleInput}
	{onchange}
>
	{#if prefix}<span slot="prefix">{@render prefix()}</span>{/if}
	{#if suffix}<span slot="suffix">{@render suffix()}</span>{/if}
</xtyle-field>

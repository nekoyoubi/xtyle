<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";
	import type { Size } from "@xtyle/core";

	interface Props {
		label?: string;
		description?: string;
		error?: string;
		size?: Size;
		invalid?: boolean;
		required?: boolean;
		for?: string;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		label = "",
		description = "",
		error = "",
		size = "md",
		invalid = false,
		required = false,
		for: htmlFor,
		children,
		...rest
	}: Props = $props();
</script>

<xtyle-form-group
	{...rest}
	{label}
	{description}
	{error}
	{size}
	invalid={invalid || undefined}
	required={required || undefined}
	for={htmlFor || undefined}
>
	{@render children?.()}
</xtyle-form-group>

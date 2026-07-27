<script lang="ts">
	import "@xtyle/core/elements/scheme-toggle.js";
	import Button from "./Button.svelte";
	import { schemeToggleGlyphs, schemeToggleHostClass, type ButtonVariant, type Size } from "@xtyle/core";

	interface Props {
		scheme?: "light" | "dark";
		label?: string;
		lightIcon?: string;
		darkIcon?: string;
		iconSize?: string;
		reverse?: boolean;
		variant?: ButtonVariant;
		size?: Size;
		/** Any other attribute (`storage-key`, `id`, `class`, `data-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		scheme,
		label,
		lightIcon,
		darkIcon,
		iconSize,
		reverse = false,
		variant = "ghost",
		size,
		...rest
	}: Props = $props();

	const name = $derived(label ?? "Toggle light and dark mode");
	const glyphs = $derived(schemeToggleGlyphs({ lightIcon, darkIcon, iconSize }));
	const hostClass = $derived(schemeToggleHostClass({ scheme, reverse }));
</script>

<xtyle-scheme-toggle
	{...rest}
	class={hostClass}
	scheme={scheme || undefined}
	label={label || undefined}
	light-icon={lightIcon || undefined}
	dark-icon={darkIcon || undefined}
	icon-size={iconSize || undefined}
	reverse={reverse || undefined}
>
	<Button iconOnly {variant} {size} ariaLabel={name} title={name}>{@html glyphs}</Button>
</xtyle-scheme-toggle>

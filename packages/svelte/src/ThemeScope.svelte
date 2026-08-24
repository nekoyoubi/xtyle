<script lang="ts">
	import "@xtyle/core/elements/theme-scope.js";
	import type { Constraints, Knobs } from "@xtyle/core";
	import type { Snippet } from "svelte";

	interface Props {
		algorithm?: string;
		target?: "self" | "root";
		scheme?: "light" | "dark";
		knobs?: Knobs;
		constraints?: Constraints;
		children?: Snippet;
		/** Any other attribute (`id`, `class`, `data-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { algorithm, target, scheme, knobs, constraints, children, ...rest }: Props = $props();

	const json = (value: unknown): string | undefined => (value === undefined ? undefined : JSON.stringify(value));

	let el: (HTMLElement & { toggleScheme(): void }) | undefined = $state();

	/** Flip this scope between light and dark, re-deriving against the same algorithm and knobs. */
	export function toggleScheme(): void {
		el?.toggleScheme();
	}
</script>

<xtyle-theme-scope
	bind:this={el}
	{...rest}
	algorithm={algorithm || undefined}
	target={target || undefined}
	scheme={scheme || undefined}
	knobs={json(knobs)}
	constraints={json(constraints)}
>
	{@render children?.()}
</xtyle-theme-scope>

<script lang="ts">
	import "@xtyle/core/elements/theme-card.js";
	import type { Constraints, Knobs } from "@xtyle/core";

	interface Props {
		algorithm?: string;
		name?: string;
		scheme?: "light" | "dark";
		knobs?: Knobs;
		constraints?: Constraints;
		interactive?: boolean;
		selected?: boolean;
		onselect?: (detail: { name: string | null; algorithm: string | null; scheme: string | null }) => void;
		/** Any other attribute (`id`, `class`, `data-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		algorithm,
		name,
		scheme,
		knobs,
		constraints,
		interactive = false,
		selected = false,
		onselect,
		...rest
	}: Props = $props();

	const json = (value: unknown): string | undefined => (value === undefined ? undefined : JSON.stringify(value));
</script>

<xtyle-theme-card
	{...rest}
	algorithm={algorithm || undefined}
	name={name || undefined}
	scheme={scheme || undefined}
	knobs={json(knobs)}
	constraints={json(constraints)}
	interactive={interactive || undefined}
	selected={selected || undefined}
	onselect={onselect ? (event: Event) => onselect((event as CustomEvent).detail) : undefined}
></xtyle-theme-card>

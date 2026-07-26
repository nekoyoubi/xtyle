<script lang="ts">
	import "@xtyle/core/elements/theme-swatch.js";
	import type { Constraints, Knobs } from "@xtyle/core";

	interface Props {
		algorithm?: string;
		tokens?: string[];
		scheme?: "light" | "dark";
		size?: "sm" | "md" | "lg";
		labels?: boolean;
		details?: boolean;
		knobs?: Knobs;
		constraints?: Constraints;
		/** Any other attribute (`id`, `class`, `data-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		algorithm,
		tokens,
		scheme,
		size,
		labels = true,
		details = false,
		knobs,
		constraints,
		...rest
	}: Props = $props();

	const json = (value: unknown): string | undefined => (value === undefined ? undefined : JSON.stringify(value));
</script>

<xtyle-theme-swatch
	{...rest}
	algorithm={algorithm || undefined}
	tokens={tokens?.length ? tokens.join(",") : undefined}
	scheme={scheme || undefined}
	size={size || undefined}
	labels={labels ? undefined : "false"}
	details={details || undefined}
	knobs={json(knobs)}
	constraints={json(constraints)}
></xtyle-theme-swatch>

<script lang="ts">
	import "./register.js";
	import type { FullTone, IconName, IconSize, SeriesScheme } from "@xtyle/core";

	interface Props {
		name: IconName | (string & {});
		size?: IconSize;
		tone?: FullTone;
		/** The series scheme a generated mark's `c3+` color slots draw from. */
		colors?: SeriesScheme;
		label?: string;
		spin?: boolean;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { name, size = "md", tone, colors, label, spin = false, ...rest }: Props = $props();
</script>

<xtyle-icon {...rest} {name} {size} {tone} {colors} {label} spin={spin ? true : undefined}></xtyle-icon>

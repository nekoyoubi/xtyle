<script lang="ts">
	import "@xtyle/core/elements/icon.js";
	import type { FullTone, IconName, IconSize, Palette } from "@xtyle/core";

	interface Props {
		name: IconName | (string & {});
		size?: IconSize;
		tone?: FullTone;
		/** The series scheme a generated mark's `c3+` color slots draw from. */
		colors?: Palette;
		label?: string;
		spin?: boolean;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let { name, size = "md", tone, colors, label, spin = false, ...rest }: Props = $props();
</script>

<xtyle-icon {...rest} {name} {size} {tone} {colors} {label} spin={spin ? true : undefined}></xtyle-icon>

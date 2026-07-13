<script lang="ts">
	import "./register.js";
	import type { Snippet } from "svelte";

	type CarouselTransition = "slide" | "fade" | "scale" | "flip";
	type CarouselDirection = "right" | "left" | "up" | "down";

	interface Props {
		label?: string;
		autoplay?: boolean;
		interval?: number;
		loop?: boolean;
		/** The prev/next arrows: `true` (a bar below), `false` (hidden), or `"overlay"` (on the slides). */
		controls?: boolean | "overlay";
		dots?: boolean;
		/** Whether hover/focus pauses autoplay (default true); set `false` for a decorative carousel that should keep cycling under the pointer. */
		pauseOnHover?: boolean;
		transition?: CarouselTransition;
		direction?: CarouselDirection;
		children?: Snippet;
		/** Any other attribute (`title`, `id`, `data-*`, `aria-*`, …) passes through to the element. */
		[key: string]: unknown;
	}

	let {
		label,
		autoplay = false,
		interval,
		loop = false,
		controls = true,
		dots = true,
		pauseOnHover = true,
		transition,
		direction,
		children,
		...rest
	}: Props = $props();
</script>

<xtyle-carousel
	{...rest}
	{label}
	{interval}
	autoplay={autoplay ? true : undefined}
	loop={loop ? true : undefined}
	controls={controls === "overlay" ? "overlay" : controls ? undefined : "false"}
	dots={dots ? undefined : "false"}
	pause-on-hover={pauseOnHover ? undefined : "false"}
	transition={transition && transition !== "slide" ? transition : undefined}
	direction={direction && direction !== "right" ? direction : undefined}
>
	{@render children?.()}
</xtyle-carousel>

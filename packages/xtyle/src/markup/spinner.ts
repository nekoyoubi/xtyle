import type { Size, Tone } from "../index.js";

export interface SpinnerMarkupProps {
	tone?: Tone;
	size?: Size;
	label?: string;
}

/** The host-layout rule for a spinner — the one `:host` rule, shared by the element's scaffold and the SSR declarative shadow root. */
export const spinnerHostCss = ":host { display: inline-flex; }";

export function spinnerClass(props: SpinnerMarkupProps): string {
	const tone = props.tone ?? "accent";
	const size = props.size ?? "md";
	return ["xtyle-spinner", `xtyle-spinner--${tone}`, size !== "md" && `xtyle-spinner--${size}`]
		.filter(Boolean)
		.join(" ");
}

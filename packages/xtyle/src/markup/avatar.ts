import type { BadgeTone, Tone } from "../index.js";

export type AvatarSize = "sm" | "md" | "lg" | "xl";
export type AvatarShape = "circle" | "square";

export interface AvatarMarkupProps {
	src?: string | null;
	alt?: string | null;
	tone?: BadgeTone;
	size?: AvatarSize;
	shape?: AvatarShape;
	status?: Tone | null;
	statusLabel?: string | null;
	pulse?: boolean | "slow" | "fast" | null;
}

/** The host-layout rule for an avatar — the one `:host` rule, shared by the element's `styles()` and the SSR declarative shadow root. */
export const avatarHostCss = ":host { display: inline-flex; }";

/** The pulse class for a live status dot: a bare / truthy `pulse` breathes at the slow cadence,
 * `"fast"` at the quick one. A no-op without a `status` dot to animate. */
export function avatarPulseClass(pulse: AvatarMarkupProps["pulse"], hasStatus: boolean): string | false {
	if (!hasStatus || pulse == null || pulse === false) return false;
	return pulse === "fast" ? "xtyle-avatar--pulse-fast" : "xtyle-avatar--pulse-slow";
}

export function avatarClass(props: AvatarMarkupProps): string {
	const tone = props.tone ?? "neutral";
	const size = props.size ?? "md";
	const shape = props.shape ?? "circle";
	return [
		"xtyle-avatar",
		`xtyle-avatar--${tone}`,
		size !== "md" && `xtyle-avatar--${size}`,
		shape === "square" && "xtyle-avatar--square",
		props.status && `xtyle-avatar--status-${props.status}`,
		avatarPulseClass(props.pulse, Boolean(props.status)),
	]
		.filter(Boolean)
		.join(" ");
}

/**
 * The single source of an avatar's shadow markup. The custom element renders it into
 * its shadow root at runtime; the `@xtyle/astro` binding emits the same string into a
 * declarative shadow root at build. Both paths render one identical control from one
 * source — no per-binding reimplementation. Pure and DOM-free, so it is safe to
 * import in any environment (SSR included).
 */
export function avatarMarkup(props: AvatarMarkupProps): string {
	const src = props.src ?? null;
	const alt = props.alt ?? "";
	const label = props.statusLabel ? `${alt} — ${props.statusLabel}`.trim() : alt;
	const image =
		src !== null
			? `<img class="xtyle-avatar__image" part="image" src="${src}" alt="${alt}" onerror="this.remove()" />`
			: "";
	const fallback = `<span class="xtyle-avatar__fallback" part="fallback"><slot name="icon"></slot><slot></slot></span>`;
	const content = `${image}${fallback}`;
	const statusDot = props.status
		? `<span class="xtyle-avatar__status-dot" part="status-dot" aria-hidden="true"></span>`
		: "";
	return `<span part="avatar" class="${avatarClass(props)}" role="img" aria-label="${label}">${content}${statusDot}</span>`;
}

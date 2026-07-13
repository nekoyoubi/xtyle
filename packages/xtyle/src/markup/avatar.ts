import type { BadgeTone, Tone } from "../index.js";
import { dotClass } from "./dot.js";
import { escapeAttr, escapeHtml } from "./escape.js";

export type AvatarSize = "sm" | "md" | "lg" | "xl";
export type AvatarShape = "circle" | "square";

export interface AvatarMarkupProps {
	src?: string | null;
	alt?: string | null;
	/** The person the avatar stands for. Supplies the initials shown when there is no image and
	 * nothing slotted, and names the avatar when no `alt` is given. Not `name`: that is a
	 * form-participation attribute on an element, and this one has nothing to do with forms. */
	userName?: string | null;
	/**
	 * The initials to paint, pre-resolved. Defaults to `avatarInitials(userName)`; pass `""` to
	 * suppress them because the consumer filled the default slot.
	 *
	 * They are rendered as *real content* rather than as the default slot's fallback, which is the
	 * only thing that actually works: every framework binding emits a whitespace text node between
	 * the element's tags, shadow DOM assigns that node to the default slot, and an assigned node —
	 * even one made of nothing but a space — suppresses the slot's fallback. So the decision of
	 * whether the consumer supplied content has to be made by whoever can see the light DOM, not
	 * deferred to the slot.
	 */
	initials?: string;
	tone?: BadgeTone;
	size?: AvatarSize;
	shape?: AvatarShape;
	status?: Tone | null;
	statusLabel?: string | null;
	pulse?: boolean | "slow" | "fast" | null;
}

/**
 * Up to two initials for a person's name: first + last for a full name, one letter for a single
 * word. Split on code points, not char codes, so a name that opens on an emoji or an astral glyph
 * yields that whole character instead of half a surrogate pair.
 */
export function avatarInitials(userName: string | null | undefined): string {
	const words = (userName ?? "").trim().split(/\s+/).filter(Boolean);
	if (!words.length) return "";
	const firstOf = (word: string): string => [...word][0] ?? "";
	const lead = firstOf(words[0] as string);
	const tail = words.length > 1 ? firstOf(words[words.length - 1] as string) : "";
	return (lead + tail).toUpperCase();
}

/** The avatar's accessible name: `alt` if given, else the person's name, with the status read after
 * it. Either half may be absent, and an absent one leaves no dangling separator behind. */
export function avatarLabel(props: AvatarMarkupProps): string {
	const name = props.alt || props.userName || "";
	const status = props.statusLabel ?? "";
	if (name && status) return `${name} — ${status}`;
	return name || status;
}

/** The host-layout rule for an avatar — the one `:host` rule, shared by the element's `styles()` and the SSR declarative shadow root. */
export const avatarHostCss = ":host { display: inline-flex; }";

/** The pulse class for a live status dot: a bare / truthy `pulse` breathes at the slow cadence,
 * `"fast"` at the quick one. A no-op without a `status` dot to animate. */
export function avatarPulseClass(pulse: AvatarMarkupProps["pulse"], hasStatus: boolean): string | false {
	if (!hasStatus || pulse == null || pulse === false) return false;
	return pulse === "fast" ? "xtyle-avatar--pulse-fast" : "xtyle-avatar--pulse-slow";
}

/**
 * The presence dot's class list, built by the `Dot` primitive's own `dotClass` — so the shape, the
 * size ramp, the pulse, and its reduced-motion hold-still all come from one typed contract rather
 * than from class-name literals re-assembled per component. The avatar adds only its own geometry
 * (`__status-dot`: scales with the chip, wears a ring). Its tone rides as `--dot-color`, set by the
 * `.xtyle-avatar--status-*` rules, so the dot carries no tone class of its own.
 */
export function avatarStatusDotClass(props: AvatarMarkupProps): string {
	const pulse = props.status
		? props.pulse === "fast"
			? "fast"
			: props.pulse
				? "slow"
				: undefined
		: undefined;
	return `${dotClass({ pulse })} xtyle-avatar__status-dot`;
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
	const label = avatarLabel(props);
	const image =
		src !== null
			? `<img class="xtyle-avatar__image" part="image" src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" onerror="this.remove()" />`
			: "";
	const initials = escapeHtml(props.initials ?? avatarInitials(props.userName));
	const initialsSpan = initials
		? `<span class="xtyle-avatar__initials" part="initials">${initials}</span>`
		: "";
	const fallback = `<span class="xtyle-avatar__fallback" part="fallback"><span class="xtyle-slot"><slot name="icon"></slot></span>${initialsSpan}<span class="xtyle-slot"><slot></slot></span></span>`;
	const content = `${image}${fallback}`;
	const statusDot = props.status
		? `<span class="${avatarStatusDotClass(props)}" part="status-dot" aria-hidden="true"></span>`
		: "";
	// Only name the avatar when there is a name to give it. An unnamed `role="img"` is a WCAG failure
	// on its own, and worse: `role="img"` makes the subtree presentational, so an avatar carrying only
	// a slotted icon would announce as a nameless image instead of exposing what it holds.
	const naming = label ? ` role="img" aria-label="${escapeAttr(label)}"` : "";
	return `<span part="avatar" class="${avatarClass(props)}"${naming}>${content}${statusDot}</span>`;
}

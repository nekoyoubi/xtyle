/**
 * The functional icon set: a name to inline-SVG-body map plus the `renderIcon`
 * helper that wraps a named body in a themeable `<svg>`. It is deliberately
 * import-free so the component fragment can inline it into its sandbox bundle,
 * the Astro SSR path can render it, and `@xtyle/core` can re-export it as a
 * public method: one source of truth for every surface.
 *
 * Every glyph draws on a `0 0 24 24` grid in `currentColor`, so an icon inherits
 * the text color around it and matches the derived theme with no tokens of its
 * own. Line glyphs stroke; a few (the dots) fill.
 */

export type IconName =
	| "chevron-up"
	| "chevron-down"
	| "chevron-left"
	| "chevron-right"
	| "chevron-expand"
	| "arrow-up"
	| "arrow-down"
	| "arrow-left"
	| "arrow-right"
	| "close"
	| "check"
	| "plus"
	| "minus"
	| "menu"
	| "more-vertical"
	| "more-horizontal"
	| "search"
	| "info"
	| "warning"
	| "error"
	| "success"
	| "external-link"
	| "maximize"
	| "dot"
	| "loader"
	| "play"
	| "pause"
	| "stop"
	| "skip-forward"
	| "skip-back"
	| "gear"
	| "folder"
	| "pencil"
	| "trash"
	| "eye"
	| "copy"
	| "palette"
	| "bookmark"
	| "download";

export type IconSize = "sm" | "md" | "lg" | "xl";

export interface RenderIconOptions {
	/** The rendered size, stepping in `em` off the surrounding text: `sm`, `md`, `lg`, `xl`. */
	size?: IconSize | null;
	/**
	 * An accessible name. When set the icon is exposed as `role="img"` with the
	 * label; when omitted the icon is decorative (`aria-hidden`) and adds no
	 * accessible name of its own.
	 */
	label?: string | null;
	/** Continuously rotate the glyph (a loading affordance); gated by `prefers-reduced-motion`. */
	spin?: boolean | null;
	/** Tint the glyph to a semantic role or named hue instead of inheriting `currentColor`. */
	tone?: string | null;
	/** Extra class names appended after the base set. */
	class?: string | null;
	/** A `part` attribute for the `<svg>`, so a host element exposes it for styling. */
	part?: string | null;
}

const stroke = (d: string): string =>
	`<path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;

const dot = (cx: number, cy: number): string => `<circle cx="${cx}" cy="${cy}" r="1.8" fill="currentColor"/>`;

const fill = (d: string): string => `<path d="${d}" fill="currentColor"/>`;

const bar = (x: number, w: number): string => `<rect x="${x}" y="5" width="${w}" height="14" rx="1" fill="currentColor"/>`;

const circle = stroke("M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z");

/** The functional icon set, keyed by name, each value the inner SVG body on a 24×24 grid. */
export const ICONS: Record<IconName, string> = {
	"chevron-up": stroke("M18 15l-6-6-6 6"),
	"chevron-down": stroke("M6 9l6 6 6-6"),
	"chevron-left": stroke("M15 18l-6-6 6-6"),
	"chevron-right": stroke("M9 6l6 6-6 6"),
	"chevron-expand": stroke("M8 9l4-4 4 4") + stroke("M16 15l-4 4-4-4"),
	"arrow-up": stroke("M12 19V5") + stroke("M6 11l6-6 6 6"),
	"arrow-down": stroke("M12 5v14") + stroke("M6 13l6 6 6-6"),
	"arrow-left": stroke("M19 12H5") + stroke("M11 6l-6 6 6 6"),
	"arrow-right": stroke("M5 12h14") + stroke("M13 6l6 6-6 6"),
	close: stroke("M18 6L6 18") + stroke("M6 6l12 12"),
	check: stroke("M20 6L9 17l-5-5"),
	plus: stroke("M12 5v14") + stroke("M5 12h14"),
	minus: stroke("M5 12h14"),
	menu: stroke("M4 6h16") + stroke("M4 12h16") + stroke("M4 18h16"),
	"more-vertical": dot(12, 5) + dot(12, 12) + dot(12, 19),
	"more-horizontal": dot(5, 12) + dot(12, 12) + dot(19, 12),
	search: stroke("M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z") + stroke("M20 20l-3.6-3.6"),
	info: circle + stroke("M12 11v5") + stroke("M12 8h.01"),
	warning: stroke("M12 3L2 20h20L12 3z") + stroke("M12 10v4") + stroke("M12 17h.01"),
	error: circle + stroke("M15 9l-6 6") + stroke("M9 9l6 6"),
	success: circle + stroke("M8.5 12l2.5 2.5L16 9"),
	"external-link": stroke("M14 4h6v6") + stroke("M20 4l-9 9") + stroke("M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"),
	maximize: stroke("M15 3h6v6") + stroke("M9 21H3v-6") + stroke("M21 3l-7 7") + stroke("M3 21l7-7"),
	dot: `<circle cx="12" cy="12" r="4" fill="currentColor"/>`,
	loader: stroke("M12 3a9 9 0 1 0 9 9"),
	play: fill("M8 5v14l11-7z"),
	pause: bar(7, 3.2) + bar(13.8, 3.2),
	stop: `<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>`,
	"skip-forward": fill("M6 5l9 7-9 7z") + bar(16, 2.6),
	"skip-back": fill("M18 5l-9 7 9 7z") + bar(5.4, 2.6),
	gear:
		stroke("M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z") +
		stroke(
			"M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
		),
	folder: stroke("M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"),
	pencil: stroke("M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"),
	trash: stroke("M3 6h18") + stroke("M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6") + stroke("M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"),
	eye: stroke("M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z") + stroke("M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"),
	copy: stroke("M10 8h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z") + stroke("M6 16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"),
	palette:
		stroke(
			"M12 3a9 9 0 1 0 0 18c.9 0 1.5-.7 1.5-1.5 0-.4-.15-.72-.4-1-.24-.27-.35-.6-.35-1 0-.8.7-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-4.4-4-8-9-8z",
		) +
		dot(8.5, 10.5) +
		dot(12, 8) +
		dot(15.5, 10.5),
	bookmark: stroke("M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"),
	download: stroke("M12 3v12") + stroke("M7 10l5 5 5-5") + stroke("M4 20h16"),
};

/** Every icon name in the set, in declaration order. */
export const ICON_NAMES: IconName[] = Object.keys(ICONS) as IconName[];

/** True when `name` resolves to a glyph in the set. */
export function hasIcon(name: string): name is IconName {
	return Object.prototype.hasOwnProperty.call(ICONS, name);
}

// Inlined rather than imported from markup/escape: this module must stay import-free so esbuild can bundle it whole into the sandboxed component fragment.
function escapeAttr(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function iconClass(opts: RenderIconOptions): string {
	const size = opts.size ?? "md";
	return [
		"xtyle-icon",
		size !== "md" && `xtyle-icon--${size}`,
		opts.tone && `xtyle-icon--${opts.tone}`,
		opts.spin && "xtyle-icon--spin",
		opts.class,
	]
		.filter(Boolean)
		.join(" ");
}

const MISSING = stroke("M5 5h14v14H5z");

/**
 * Renders a named glyph as a themeable `<svg>` string. An unknown name renders a
 * visible placeholder box rather than nothing, so a typo shows on screen instead
 * of silently vanishing. When `label` is set the icon carries `role="img"` and
 * the name; otherwise it is `aria-hidden`.
 */
export function renderIcon(name: string, opts: RenderIconOptions = {}): string {
	const body = hasIcon(name) ? ICONS[name] : MISSING;
	const part = opts.part ? ` part="${escapeAttr(opts.part)}"` : "";
	const a11y = opts.label
		? `role="img" aria-label="${escapeAttr(opts.label)}"`
		: `aria-hidden="true"`;
	const title = opts.label ? `<title>${escapeAttr(opts.label)}</title>` : "";
	return `<svg${part} class="${iconClass(opts)}" viewBox="0 0 24 24" width="1em" height="1em" focusable="false" ${a11y}>${title}${body}</svg>`;
}

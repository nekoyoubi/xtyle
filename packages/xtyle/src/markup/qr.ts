import type { QrEcLevel, QrModuleShape } from "../qr.js";

export type { QrEcLevel, QrModuleShape };

/** How a QR symbol chooses its two colors. `theme` inks it from the live tokens (`--fg-0` on
 * `--bg-0`); `bitonal` forces guaranteed-scannable black-on-white regardless of theme; `auto` uses
 * the theme colors when they clear the scannability floor and silently falls back to bitonal when
 * they don't. */
export type QrMode = "theme" | "bitonal" | "auto";

export const QR_MODES: readonly QrMode[] = ["theme", "bitonal", "auto"];
export const QR_MODULE_SHAPES: readonly QrModuleShape[] = ["square", "dot", "rounded"];

/** The host-layout rule, shared by the element scaffold and the SSR shadow root. */
export const qrHostCss = ":host { display: inline-block; }";

/** Named logo sizes, as fractions of the symbol width. The default `md` is the conventional QR logo
 * size; `xl` is the largest still comfortably inside the ~30% occlusion budget of EC level H, which
 * the element forces whenever a logo is present. */
export type QrIconSize = "sm" | "md" | "lg" | "xl";

export const QR_ICON_SCALES: Record<QrIconSize, number> = {
	sm: 0.18,
	md: 0.24,
	lg: 0.28,
	xl: 0.32,
};

export const QR_ICON_SIZES: readonly QrIconSize[] = ["sm", "md", "lg", "xl"];

/** The default fraction of the symbol width an injected logo occupies (the `md` preset). */
export const QR_LOGO_SCALE = QR_ICON_SCALES.md;

/** Side of the centered logo patch (in modules) for the given scale — the count of modules cleared
 * (or covered) for the mark, sized to wrap it tightly so the glyph fills the patch rather than
 * floating in whitespace. Clamped to a scannable range. */
export function qrLogoModules(matrixSize: number, scale = QR_LOGO_SCALE): number {
	const clamped = Math.max(0.1, Math.min(0.4, scale));
	return Math.max(3, Math.ceil(matrixSize * clamped));
}

const SAFE_SCHEME = /^(https?:|mailto:|tel:)/i;
const BARE_HOST = /^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i;

/** A safe `href` for the payload when it is a link, or `null` when it is not — so the framed caption
 * can render as a real link a reader can follow. Only `http(s)` / `mailto:` / `tel:` schemes and bare
 * hostnames (promoted to `https://`) are linkified; anything else (a `WIFI:` string, plain text, a
 * `javascript:` URL) stays inert text. */
export function qrLinkHref(data: string): string | null {
	const trimmed = data.trim();
	if (!trimmed || /\s/.test(trimmed)) return null;
	if (SAFE_SCHEME.test(trimmed)) return trimmed;
	if (BARE_HOST.test(trimmed)) return `https://${trimmed}`;
	return null;
}

/** Everything the fragment needs to draw one symbol. The element and the Astro binding both build
 * this (encode → path → color decision); the fragment stays a pure renderer. */
export interface QrBindings {
	/** The SVG `d` for every dark module. */
	path: string;
	/** The symbol's viewBox (symbol size + two quiet zones, in module units). */
	viewBox: string;
	/** The viewBox side length in module units (used to place the logo as a percentage). */
	extent: number;
	/** Explicit module color when the mode pins one (bitonal, or auto falling back); omit to ink from
	 * the `--qr-module` token. */
	moduleColor?: string | null;
	/** Explicit background color, paired with `moduleColor`; omit to ink from `--qr-bg`. */
	bgColor?: string | null;
	shape: QrModuleShape;
	/** Rendered pixel size of the symbol. */
	size: number;
	/** The centered box (viewBox units) an injected logo occupies, present only when one is set. */
	logoBox?: { x: number; y: number; size: number } | null;
	/** An xtyle icon name to drop in the center. */
	iconName?: string | null;
	/** An image URL to drop in the center (an alternative to `iconName`). */
	logoSrc?: string | null;
	/** Lay the logo over the modules (leaning on error correction) instead of knocking a hole in them. */
	iconOverlay?: boolean;
	/** Give the logo a contrasting halo so it stays distinct against the modules. */
	iconOutline?: boolean;
	/** Wrap the symbol in a frame that prints the payload beneath it. */
	frame: boolean;
	/** The frame's caption text (defaults to the payload). */
	caption?: string | null;
	/** A safe `href` for the caption when the payload is a link; renders it as a real link instead of text. */
	linkHref?: string | null;
	/** Show a small button on the frame that swaps between the themed and bitonal renderings live. */
	modeToggle?: boolean;
	/** Whether the symbol is currently rendering bitonal (drives the toggle's pressed state). */
	isBitonal?: boolean;
	/** The accessible name announced for the symbol. */
	label: string;
	/** True when the theme colors fell below the scannability floor — surfaced as `data-contrast`. */
	lowContrast?: boolean;
	version: number;
	ecLevel: QrEcLevel;
}

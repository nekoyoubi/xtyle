/**
 * Scheme-toggle markup shared by the element (client) and the SSR bindings (Astro/Svelte), so both
 * emit byte-identical glyphs and host classes. The control itself is an `<xtyle-button>`; this only
 * supplies the two glyphs it holds and the host class that picks which one shows.
 */

const escapeAttr = (value: string): string =>
	value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

const SUN =
	`<svg class="xtyle-scheme-toggle__glyph" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">` +
	`<circle cx="12" cy="12" r="4"></circle>` +
	`<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path></svg>`;

const MOON =
	`<svg class="xtyle-scheme-toggle__glyph" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">` +
	`<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path></svg>`;

/** A named xtyle icon overrides the built-in glyph; it upgrades in place once the runtime loads. */
function glyph(name: string | null | undefined, fallback: string, size: string): string {
	return name
		? `<xtyle-icon class="xtyle-scheme-toggle__glyph" name="${escapeAttr(name)}" size="${escapeAttr(size)}"></xtyle-icon>`
		: fallback;
}

export interface SchemeToggleGlyphOptions {
	lightIcon?: string | null;
	darkIcon?: string | null;
	/** The glyph's own size, independent of the control's. Defaults to `md`. */
	iconSize?: string | null;
}

/** Both glyphs — the light face (default a sun) and the dark face (default a moon). The host class
 * shows exactly one; a mod or the `light-icon` / `dark-icon` props swap the glyphs. */
export function schemeToggleGlyphs(opts: SchemeToggleGlyphOptions = {}): string {
	const size = opts.iconSize ?? "md";
	return (
		`<span class="xtyle-scheme-toggle__light" aria-hidden="true">${glyph(opts.lightIcon, SUN, size)}</span>` +
		`<span class="xtyle-scheme-toggle__dark" aria-hidden="true">${glyph(opts.darkIcon, MOON, size)}</span>`
	);
}

export interface SchemeToggleClassOptions {
	scheme?: string | null;
	reverse?: boolean;
}

/** The host class list: the base class, the current scheme, and whether the display is reversed. CSS
 * keys glyph visibility off these, so a scheme flip is a class change, not a re-render. */
export function schemeToggleHostClass(opts: SchemeToggleClassOptions = {}): string {
	const scheme =
		opts.scheme === "light"
			? "xtyle-scheme-toggle--light"
			: opts.scheme === "dark"
				? "xtyle-scheme-toggle--dark"
				: "xtyle-scheme-toggle--auto";
	return ["xtyle-scheme-toggle", scheme, opts.reverse ? "xtyle-scheme-toggle--reverse" : ""]
		.filter(Boolean)
		.join(" ");
}

/**
 * HTML escape utilities for shadow markup string construction.
 * All markup modules that build strings via template literals must escape
 * user-supplied content through these — JSX/template-literal bindings escape
 * for free; this path does not.
 */

/** Escapes `&`, `<`, and `>` for safe interpolation into HTML text nodes. */
export function escapeHtml(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Escapes `&`, `<`, `>`, and `"` for safe interpolation into HTML attribute values. */
export function escapeAttr(value: string): string {
	return escapeHtml(value).replace(/"/g, "&quot;");
}

/**
 * Escapes a value for interpolation inside a quoted CSS string — `url('…')`, a `content:`, a font family.
 *
 * A well-formed URL contains none of these characters, so this is a no-op on good input and a muzzle on
 * bad: a quote can no longer close the string, a `)` can no longer close the `url()`, and a `<` can no
 * longer open a `</style>` and escape the stylesheet entirely. CSS hex escapes (`\27 `) are inert
 * everywhere the raw character would not be.
 */
export function escapeCssUrl(value: string): string {
	return value.replace(/[\\'"()<>\s;]/g, (c) => `\\${(c.codePointAt(0) as number).toString(16)} `);
}

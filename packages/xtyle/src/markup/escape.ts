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

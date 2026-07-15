/** An actionable menu row: a label, an optional value, and optional state/hint. */
export interface MenuAction {
	label: string;
	value?: string;
	disabled?: boolean;
	/** A trailing, muted, monospaced hint shown at the end of the row, e.g. an accelerator like `Ctrl+S`. Display-only; it is not part of the row's accessible name. */
	hint?: string;
	/** `"danger"` tints the row destructive (a delete / discard / close action), so the one irreversible item reads differently from the rest. Defaults to `"default"`. */
	intent?: "danger" | "default";
}

/**
 * One entry in a menu's `items` array. An action row, a `{ separator: true }` divider, or a
 * `{ heading: string }` group label that opens a labeled section the following actions sit under.
 */
export type MenuItem = MenuAction | { separator: true } | { heading: string };

/** The host-layout rules for a menu — the `:host` rules, shared by the element's `styles()` and the SSR declarative shadow root.
 * A cursor-anchored (`context`) menu draws no trigger, so it collapses to `display: contents` rather than `none`: a popover
 * inside a `display: none` subtree cannot be shown at all. */
export const menuHostCss = ":host { display: inline-block; } :host([context]) { display: contents; }";

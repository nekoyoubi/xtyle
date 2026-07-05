const BACKSLASH = /\\/g;
const DQUOTE = /"/g;
const NEWLINE = /\n/g;
const CR = /\r/g;

/**
 * Escape a value for interpolation inside a double-quoted CSS attribute selector,
 * e.g. `[data-value="${escapeSelectorValue(value)}"]`. Runs in the xript sandbox
 * (no DOM `CSS.escape`), so a value carrying a `"` (or `\`) no longer produces an
 * invalid selector that throws when the fragment's update hook re-queries a node.
 */
export function escapeSelectorValue(value: string): string {
	return value.replace(BACKSLASH, "\\\\").replace(DQUOTE, '\\"').replace(NEWLINE, "\\A ").replace(CR, "\\D ");
}

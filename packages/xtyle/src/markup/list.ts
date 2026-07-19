import { LIST_INTERACTIONS, LIST_SELECTIONS, ORIENTATIONS } from "../vocab.js";
/**
 * Shared types and helpers for `<xtyle-list>`, the reference skin over the collection substrate
 * (`elements/collection/`). Kept beside the other component markup so a framework binding and the
 * element normalize items the same way. See `docs/collection-substrate.md`.
 */

export interface ListAction {
	id: string;
	label: string;
	icon?: string;
	disabled?: boolean;
}

export interface ListItem {
	value: string;
	label: string;
	disabled?: boolean;
	/** A leading icon name (rendered through `<xtyle-icon>`). */
	lead?: string;
	/** Trailing text: a shortcut, count, or badge. */
	trail?: string;
	/** Marks the item selected on first render, honored per the selection mode's cardinality. */
	selected?: boolean;
	/** Per-item action buttons (the `actionable` posture); each emits a `list-action` event. */
	actions?: ListAction[];
}

export type ListInput = string | Array<string | ListItem>;
export type ListInteraction = (typeof LIST_INTERACTIONS)[number];
export type ListSelection = (typeof LIST_SELECTIONS)[number];
export type ListOrientation = (typeof ORIENTATIONS)[number];

function parseToken(token: string, index: number): ListItem {
	const trimmed = token.trim();
	const colon = trimmed.indexOf(":");
	if (colon === -1) {
		const label = trimmed || String(index);
		return { value: label, label };
	}
	return { label: trimmed.slice(0, colon).trim(), value: trimmed.slice(colon + 1).trim() };
}

/** Items as the comma-string shorthand (`label:value` pairs or bare labels), or a structured
 * `(string | ListItem)[]` for labels that carry commas/colons or need lead/trail/actions. */
export function normalizeItems(input: ListInput | null | undefined): ListItem[] {
	if (input == null) return [];
	if (typeof input === "string") {
		if (!input.trim()) return [];
		return input.split(",").map((token, i) => parseToken(token, i));
	}
	return input.map((item, i) => (typeof item === "string" ? parseToken(item, i) : { ...item }));
}

/** The keys authored `selected: true`, clamped to the selection mode's cardinality (`single` keeps
 * the first, `none` keeps nothing). The seed the element hands the `SelectionModel` on first render. */
export function seededSelection(items: ListItem[], mode: ListSelection): string[] {
	if (mode === "none") return [];
	const flagged = items.filter((item) => item.selected && !item.disabled).map((item) => item.value);
	return mode === "single" ? flagged.slice(0, 1) : flagged;
}

export const listHostCss = ":host { display: block; }";

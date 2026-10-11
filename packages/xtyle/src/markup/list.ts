import { LIST_INTERACTIONS, LIST_ITEM_VARIANTS, LIST_SELECTIONS, ORIENTATIONS, resolveOptionalTone, resolveOptionalVocab, type FullTone } from "../vocab.js";
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

export interface ListBadge {
	text: string;
	tone?: FullTone;
}

export interface ListItem {
	value: string;
	label: string;
	disabled?: boolean;
	/** A leading icon name (rendered through `<xtyle-icon>`). */
	lead?: string;
	/** Trailing text: a shortcut or count. A list gives several fields, each its own `trail-N` part so a column lines up across rows. */
	trail?: string | string[];
	/** A second line under the label, announced through `aria-describedby`. */
	description?: string;
	/** A chip beside the label ("new", "equipped", "locked"): a string, a toned `ListBadge`, or a list of them. Announced with the row. */
	badge?: string | ListBadge | Array<string | ListBadge>;
	/** Marks the item selected on first render, honored per the selection mode's cardinality. */
	selected?: boolean;
	/** Per-item action buttons (the `actionable` posture); each emits a `list-action` event. */
	actions?: ListAction[];
	/** Makes the item a section heading: the items after it, up to the next heading, render as one labelled group. A heading is never focused, selected, or activated. */
	heading?: boolean;
	/** Makes the item a toggle row: it leads with a check mark and announces its state (`aria-checked` on an option, a visually hidden state word otherwise). Absent, the row is ordinary. */
	checked?: boolean;
	/** Paints the row (or a heading's whole section) in a tone's on-surface ink. An unrecognized tone warns and renders with none. */
	tone?: FullTone;
	/** Gives the row a fill or an outline in its `tone` (accent when it names none), for a list of choices that read as buttons. */
	variant?: ListItemVariant;
	/** Paints only the trailing fields in a tone's ink, leaving the row as it is. */
	trailTone?: FullTone;
	/** The key that takes this item. Its first occurrence in `label` is drawn as the accelerator, and the row carries it as `aria-keyshortcuts`. */
	accelerator?: string;
	/** Makes the item a break between rows with no text of its own. Never focused, selected, or activated. */
	separator?: boolean;
}

export type ListItemVariant = (typeof LIST_ITEM_VARIANTS)[number];

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
	return input.map((item, i) => (typeof item === "string" ? parseToken(item, i) : structuredItem(item)));
}

function structuredItem(item: ListItem): ListItem {
	const copy: ListItem = { ...item };
	if (copy.heading !== true) delete copy.heading;
	if (typeof copy.checked !== "boolean") delete copy.checked;
	const tone = resolveOptionalTone<FullTone>(copy.tone);
	if (tone === null) delete copy.tone;
	else copy.tone = tone;
	if (copy.badge === undefined || copy.badge === null) delete copy.badge;
	else copy.badge = listBadges(copy.badge);
	if (Array.isArray(copy.trail)) copy.trail = copy.trail.filter((text) => typeof text === "string" && text !== "");
	if (typeof copy.description !== "string" || copy.description === "") delete copy.description;
	if (copy.separator !== true) delete copy.separator;
	const trailTone = resolveOptionalTone<FullTone>(copy.trailTone);
	if (trailTone === null) delete copy.trailTone;
	else copy.trailTone = trailTone;
	const variant = resolveOptionalVocab(copy.variant, LIST_ITEM_VARIANTS, "list item variant");
	if (variant === null) delete copy.variant;
	else copy.variant = variant;
	if (typeof copy.accelerator !== "string" || copy.accelerator === "") delete copy.accelerator;
	return copy;
}

function listBadges(badge: NonNullable<ListItem["badge"]>): ListBadge[] {
	const list = Array.isArray(badge) ? badge : [badge];
	return list.flatMap((entry) => {
		const raw = typeof entry === "string" ? { text: entry } : entry;
		if (!raw || typeof raw.text !== "string" || raw.text === "") return [];
		const tone = resolveOptionalTone<FullTone>(raw.tone);
		return [tone === null ? { text: raw.text } : { text: raw.text, tone }];
	});
}

/** The keys authored `selected: true`, clamped to the selection mode's cardinality (`single` keeps
 * the first, `none` keeps nothing). The seed the element hands the `SelectionModel` on first render. */
export function seededSelection(items: ListItem[], mode: ListSelection): string[] {
	if (mode === "none") return [];
	const flagged = items.filter((item) => item.selected && !item.disabled && !item.heading && !item.separator).map((item) => item.value);
	return mode === "single" ? flagged.slice(0, 1) : flagged;
}

export const listHostCss = ":host { display: block; }";

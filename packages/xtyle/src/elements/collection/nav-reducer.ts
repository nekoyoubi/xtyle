/**
 * The linear keyboard reducer shared by every collection skin: it owns the axis motion (arrows,
 * Home/End) and reports Enter/Space as an activation, and it owns *only* that. Keys it doesn't
 * recognize — Left/Right on a vertical tree, typeahead, PageUp/Down — return an empty result so the
 * component can handle them and compose its own axis on top (the tree/table "wrap the core" pattern).
 *
 * Pure and DOM-free; returns a serializable move, never touching focus itself (focus is a host
 * effect applied from the returned intent). See `docs/collection-substrate.md`.
 */
import { firstKey, lastKey, stepKey, type NavItem } from "./roving.js";

export type NavOrientation = "vertical" | "horizontal" | "both";

export interface NavIntent {
	/** The key to move the cursor to. */
	focus?: string;
	/** Enter/Space was pressed on the current item; the caller decides what activation means. */
	activate?: boolean;
	/** The reducer recognized and consumed the key (so the caller should preventDefault). */
	handled?: boolean;
}

export interface NavOptions {
	orientation?: NavOrientation;
	/** Step past an end wraps to the other end, rather than clamping. */
	wrap?: boolean;
	/** Handle Home/End. */
	homeEnd?: boolean;
}

function axisKeys(orientation: NavOrientation): { next: string[]; prev: string[] } {
	switch (orientation) {
		case "horizontal":
			return { next: ["ArrowRight"], prev: ["ArrowLeft"] };
		case "both":
			return { next: ["ArrowDown", "ArrowRight"], prev: ["ArrowUp", "ArrowLeft"] };
		default:
			return { next: ["ArrowDown"], prev: ["ArrowUp"] };
	}
}

export function linearNav(
	items: NavItem[],
	currentKey: string | null,
	key: string,
	opts: NavOptions = {},
): NavIntent {
	const orientation = opts.orientation ?? "vertical";
	const wrap = opts.wrap ?? false;
	const { next, prev } = axisKeys(orientation);

	if (next.includes(key)) {
		const target = stepKey(items, currentKey, 1, wrap);
		return target !== null ? { focus: target, handled: true } : { handled: true };
	}
	if (prev.includes(key)) {
		const target = stepKey(items, currentKey, -1, wrap);
		return target !== null ? { focus: target, handled: true } : { handled: true };
	}
	if (opts.homeEnd && key === "Home") {
		const target = firstKey(items);
		return target !== null ? { focus: target, handled: true } : { handled: true };
	}
	if (opts.homeEnd && key === "End") {
		const target = lastKey(items);
		return target !== null ? { focus: target, handled: true } : { handled: true };
	}
	if (key === "Enter" || key === " " || key === "Spacebar") {
		return { activate: true, handled: true };
	}
	return {};
}

/**
 * Linear navigation primitives over an ordered list of keyed items — the stepping math every
 * collection skin re-derived (the `(here ± 1 + n) % n` wrap loop and first/last-with-skip). Pure and
 * DOM-free, so it is consumed two ways: bundled into a fragment's sandbox `mod.ts` and imported
 * directly host-side by a decorator (see `docs/collection-substrate.md`).
 */

export interface NavItem {
	key: string;
	/** Not a focus stop: a disabled option, or a structurally-skipped row like a tree's static header. */
	skip?: boolean;
}

function focusableAt(items: NavItem[], index: number): string | null {
	const item = items[index];
	return item && !item.skip ? item.key : null;
}

export function firstKey(items: NavItem[]): string | null {
	for (let i = 0; i < items.length; i++) {
		const key = focusableAt(items, i);
		if (key !== null) return key;
	}
	return null;
}

export function lastKey(items: NavItem[]): string | null {
	for (let i = items.length - 1; i >= 0; i--) {
		const key = focusableAt(items, i);
		if (key !== null) return key;
	}
	return null;
}

/**
 * The next focusable key after `fromKey` in direction `dir` (+1 forward, -1 back), skipping
 * `skip` items. `wrap` continues cyclically past an end; otherwise the boundary returns `null`
 * (a clamp). A `fromKey` not in the list is treated as "before the start" for forward motion.
 */
export function stepKey(items: NavItem[], fromKey: string | null, dir: 1 | -1, wrap = false): string | null {
	const n = items.length;
	if (n === 0) return null;
	// A null or unknown cursor sits just outside the range on the side the step comes from, so a
	// forward step lands on the first item and a backward step on the last.
	const found = fromKey === null ? -1 : items.findIndex((it) => it.key === fromKey);
	const here = found === -1 ? (dir > 0 ? -1 : n) : found;
	for (let s = 1; s <= n; s++) {
		let idx = here + dir * s;
		if (wrap) idx = ((idx % n) + n) % n;
		else if (idx < 0 || idx >= n) return null;
		const key = focusableAt(items, idx);
		if (key !== null) return key;
		if (wrap && idx === here) break;
	}
	return null;
}

/**
 * Resolve the roving tab stop: the first *live, focusable* key among `prefer` (e.g. the last-focused
 * key, then the selected key), else the first focusable item. This is what keeps a collection in the
 * tab order — a stale preference is dropped rather than leaving every item at `tabindex="-1"`.
 */
export function resolveRoving(items: NavItem[], prefer: Array<string | null>): string | null {
	const focusable = new Set(items.filter((it) => !it.skip).map((it) => it.key));
	for (const key of prefer) {
		if (key !== null && focusable.has(key)) return key;
	}
	return firstKey(items);
}

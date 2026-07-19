import { SELECTION_MODES } from "../../vocab.js";
/**
 * The selection state machine every selection-bearing skin shares — `none | single | multi | range`
 * over opaque string keys. Pure and DOM-free: it owns *which keys are selected*, not how they're
 * marked. A skin maps `selectedKeys()` onto `aria-selected` / `aria-checked` / `aria-current` and the
 * `--selection-cue` state per its own role; a decorator (table) writes them onto its `<tr>`s. The
 * range machine (anchor + extend) is the piece nobody wants to write twice. See
 * `docs/collection-substrate.md`.
 */

export type SelectionMode = (typeof SELECTION_MODES)[number];

export class SelectionModel {
	private mode: SelectionMode;
	private selected = new Set<string>();
	private anchorKey: string | null = null;

	constructor(mode: SelectionMode = "none") {
		this.mode = mode;
	}

	getMode(): SelectionMode {
		return this.mode;
	}

	setMode(mode: SelectionMode): void {
		if (mode === this.mode) return;
		this.mode = mode;
		if (mode === "none") this.clear();
		else if (mode === "single" && this.selected.size > 1) {
			const first = this.anchorKey ?? this.selectedKeys()[0] ?? null;
			this.selected = first !== null ? new Set([first]) : new Set();
		}
	}

	get size(): number {
		return this.selected.size;
	}

	get anchor(): string | null {
		return this.anchorKey;
	}

	selectedKeys(): string[] {
		return [...this.selected];
	}

	isSelected(key: string): boolean {
		return this.selected.has(key);
	}

	/** Select exactly `key`, discarding any prior selection, and set it as the range anchor. */
	replaceWith(key: string): void {
		if (this.mode === "none") return;
		this.selected = new Set([key]);
		this.anchorKey = key;
	}

	/** Add/remove `key` without disturbing the rest (multi/range), and move the anchor to it. In
	 * single, a toggle of the selected key clears it; otherwise it replaces. In none, a no-op. */
	toggle(key: string): void {
		if (this.mode === "none") return;
		if (this.mode === "single") {
			if (this.selected.has(key)) this.clear();
			else this.replaceWith(key);
			return;
		}
		if (this.selected.has(key)) this.selected.delete(key);
		else this.selected.add(key);
		this.anchorKey = key;
	}

	/** Replace the selection with the contiguous span from the anchor to `key` over `orderedKeys`
	 * (range mode). The anchor is unchanged, so a further extend re-spans from the same origin. In any
	 * other mode this falls back to `replaceWith`. */
	extendTo(key: string, orderedKeys: string[]): void {
		if (this.mode !== "range") {
			this.replaceWith(key);
			return;
		}
		const anchor = this.anchorKey ?? key;
		const from = orderedKeys.indexOf(anchor);
		const to = orderedKeys.indexOf(key);
		if (from === -1 || to === -1) {
			this.replaceWith(key);
			return;
		}
		const [lo, hi] = from <= to ? [from, to] : [to, from];
		this.selected = new Set(orderedKeys.slice(lo, hi + 1));
		this.anchorKey = anchor;
	}

	clear(): void {
		this.selected = new Set();
		this.anchorKey = null;
	}

	/** Reseed from an external "these keys are selected" set (e.g. authored `selected` flags). */
	reset(keys: Iterable<string>): void {
		this.selected = this.mode === "none" ? new Set() : new Set(keys);
		if (this.mode === "single" && this.selected.size > 1) {
			const first = this.selectedKeys()[0];
			this.selected = first !== undefined ? new Set([first]) : new Set();
		}
		this.anchorKey = this.selectedKeys()[0] ?? null;
	}

	/** Drop any selected key not present in `liveKeys` (reconcile after a data change). Returns whether
	 * anything changed, so a caller can skip a needless re-render. */
	retain(liveKeys: Set<string>): boolean {
		let changed = false;
		for (const key of [...this.selected]) {
			if (!liveKeys.has(key)) {
				this.selected.delete(key);
				changed = true;
			}
		}
		if (this.anchorKey !== null && !liveKeys.has(this.anchorKey)) {
			this.anchorKey = null;
			changed = true;
		}
		return changed;
	}
}

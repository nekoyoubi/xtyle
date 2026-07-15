/** One runnable command in a palette. `id` is its identity — what `select` reports and what recents remember. */
export interface CommandItem {
	/** Stable identity. Reported on `select`, and the key recents are stored under. */
	id: string;
	/** What the user reads and types against. */
	label: string;
	/** The heading this command sits under. Ungrouped commands render in a headingless run. */
	group?: string;
	/** Secondary text shown after the label — a path, a scope, a short description. */
	hint?: string;
	/** The command's own keyboard shortcut, rendered as keycaps (`"Ctrl+Shift+P"`). */
	shortcut?: string;
	/** Extra words the filter matches even though they never render — synonyms, an old name. */
	keywords?: string[];
	/** Listed but not runnable: still filterable, never focusable, never selected. */
	disabled?: boolean;
}

/** What a scorer says about one item against one query: how well it fits, and which label characters matched. */
export interface CommandMatch {
	/** Higher ranks earlier. Ties keep the item's declared order. */
	score: number;
	/** Indices into `item.label` that the query matched, for the highlight. Omit and nothing is highlighted. */
	indices?: number[];
}

/**
 * The ranking hook. Return `null` to filter an item out, or a `CommandMatch` to keep it. The default
 * (`subsequenceScorer`) is a plain subsequence matcher; a consumer with their own ranking (a real fuzzy
 * library, a usage-weighted model, a server-side search) supplies one of these instead and the palette
 * renders whatever it returns, in whatever order it scores.
 */
export type CommandScorer = (query: string, item: CommandItem) => CommandMatch | null;

/** How a palette closed — carried on the `close` event's detail. */
export type CommandCloseReason = "escape" | "dismiss" | "select" | "api";

const WORD_BREAK = /[^a-z0-9]/i;

const CONSECUTIVE_BONUS = 6;
const HEAD_BONUS = 10;
const WORD_START_BONUS = 8;
const CAMEL_BONUS = 4;
const LATE_START_PENALTY = 0.2;
const LENGTH_PENALTY = 0.05;
/** A keyword / group / hint hit is a real match but a weaker signal than the label itself. */
const SECONDARY_WEIGHT = 0.5;

function isCamelBoundary(text: string, at: number): boolean {
	const here = text[at] ?? "";
	const before = text[at - 1] ?? "";
	return here !== here.toLowerCase() && before !== "" && before === before.toLowerCase();
}

/**
 * Match a query against a string as an ordered subsequence: every query character must appear in the
 * text, in order, but not adjacently — so `of` finds "Open File" and `gcm` finds "Git: Commit Message".
 * The score rewards runs, word starts, and camelCase humps, and docks a match that starts late or sits
 * in a long label, so the tightest, earliest, shortest hit wins. Returns `null` when a character is
 * missing, and the matched character positions when it hits.
 */
export function subsequenceMatch(query: string, text: string): CommandMatch | null {
	const needle = query.replace(/\s+/g, "").toLowerCase();
	if (needle === "") return { score: 0 };
	if (text === "") return null;
	const hay = text.toLowerCase();
	const indices: number[] = [];
	let score = 0;
	let from = 0;
	let previous = -2;
	for (const char of needle) {
		const at = hay.indexOf(char, from);
		if (at === -1) return null;
		let bonus = 1;
		if (at === previous + 1) bonus += CONSECUTIVE_BONUS;
		if (at === 0) bonus += HEAD_BONUS;
		else if (WORD_BREAK.test(text[at - 1] ?? "")) bonus += WORD_START_BONUS;
		else if (isCamelBoundary(text, at)) bonus += CAMEL_BONUS;
		score += bonus;
		indices.push(at);
		previous = at;
		from = at + 1;
	}
	score -= (indices[0] ?? 0) * LATE_START_PENALTY;
	score -= text.length * LENGTH_PENALTY;
	return { score, indices };
}

/**
 * The palette's default ranking: a subsequence match against the label, falling back to the item's
 * group, hint, and keywords when the label misses — so a command still surfaces on a synonym it never
 * displays. A secondary hit scores at half weight and reports no indices, because those positions
 * index a string the user is not looking at.
 */
export const subsequenceScorer: CommandScorer = (query, item) => {
	const direct = subsequenceMatch(query, item.label);
	if (direct) return direct;
	const secondary = [item.group, item.hint, ...(item.keywords ?? [])].filter(Boolean).join(" ");
	const hit = secondary === "" ? null : subsequenceMatch(query, secondary);
	return hit ? { score: hit.score * SECONDARY_WEIGHT } : null;
};

/** Split a label into matched / unmatched runs, so the fragment can mark the hit characters without re-matching. */
export function highlightRuns(label: string, indices: number[] | undefined): { text: string; match: boolean }[] {
	if (!indices || indices.length === 0) return label === "" ? [] : [{ text: label, match: false }];
	const hit = new Set(indices);
	const runs: { text: string; match: boolean }[] = [];
	for (let at = 0; at < label.length; at += 1) {
		const match = hit.has(at);
		const last = runs[runs.length - 1];
		if (last && last.match === match) last.text += label[at];
		else runs.push({ text: label[at] ?? "", match });
	}
	return runs;
}

/** The host-layout rule for a command palette: the element itself takes no layout — the surface is a top-layer
 * `<dialog>`, so the host is only a mount point wherever the consumer happened to declare it. */
export const commandPaletteHostCss = ":host { display: contents; }";

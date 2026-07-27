/**
 * When each thing the system offers arrived.
 *
 * Every surface xtyle *adds to* — components, algorithms, knobs, emit formats, agent tools — is a
 * surface someone builds against from a pinned dependency. A consumer on 0.8 asking what they can
 * use is asking a question about 0.8, and an answer drawn from HEAD is wrong in the one direction
 * that costs them a runtime error. The fix is not clever: record when each thing arrived, and let
 * every reader filter by it.
 *
 * Components had `since` from the start, which is why the catalogue could be dated at all. Nothing
 * else did, and the asymmetry was invisible until a version-scoped question got asked of something
 * that wasn't a component. This module is the shared vocabulary so the next surface inherits it
 * rather than rediscovering the gap.
 *
 * ## The rule
 *
 * **Anything enumerable that a release can add to declares `since`.** Not in a central ledger — a
 * second list of what exists is a second thing to forget to update, and it drifts silently because
 * nothing fails when it does. It goes on the declaration itself, where the thing is defined, and
 * `provenance.test.ts` fails the build if a new entry omits it or claims a version that hasn't
 * shipped.
 *
 * ## What `0.1.0` means here
 *
 * Two different facts share that value, and the distinction matters when reading the data: some
 * things genuinely shipped in the first release, and some predate the bookkeeping and were
 * backfilled to the floor because their real arrival is unknowable without archaeology. Both are
 * honest as "you have always been able to rely on this"; neither should be read as a dated claim.
 * Anything added from here on states a real version, because the test will not let it not.
 */

/** The floor: shipped in the first release, or predating the bookkeeping and backfilled to it. */
export const SINCE_FLOOR = "0.1.0";

/** Anything a release can add to, and therefore anything a consumer can ask about by version. */
export interface Provenanced {
	/** The xtyle version this first shipped in. */
	since?: string;
}

/**
 * Compare two dotted versions numerically.
 *
 * The whole reason this is a function and not a `<`: a string comparison puts `0.10.0` *below*
 * `0.9.0`, so the newest release sorts as the oldest and every "what existed then" answer silently
 * inverts at the first double-digit minor. Which xtyle reached this cycle.
 */
export function compareVersions(a: string, b: string): number {
	const parse = (v: string): number[] =>
		v
			.replace(/^v/, "")
			.split("-")[0]!
			.split(".")
			.map((n) => Number.parseInt(n, 10) || 0);
	const left = parse(a);
	const right = parse(b);
	for (let i = 0; i < Math.max(left.length, right.length); i++) {
		const diff = (left[i] ?? 0) - (right[i] ?? 0);
		if (diff !== 0) return diff < 0 ? -1 : 1;
	}
	return 0;
}

/**
 * Whether something introduced in `since` existed yet at `asOf`.
 *
 * A missing `since` reads as "always", which is the forgiving direction on purpose: an undated entry
 * showing up in an older answer is a stale doc, while an undated entry *vanishing* from every answer
 * is a component that appears deleted. The test is what stops undated entries accumulating; this is
 * only what happens if one slips past a reader that never ran it.
 */
export function existedAt(since: string | undefined, asOf: string): boolean {
	if (!since) return true;
	return compareVersions(since, asOf) <= 0;
}

/** Keep only what existed at `asOf`, and say how much was held back. */
export function availableAt<T extends Provenanced>(items: readonly T[], asOf: string): { available: T[]; omitted: number } {
	const available = items.filter((item) => existedAt(item.since, asOf));
	return { available, omitted: items.length - available.length };
}

/** Every distinct version something arrived in, oldest first. */
export function versionsPresent(items: readonly Provenanced[]): string[] {
	return [...new Set(items.map((i) => i.since ?? SINCE_FLOOR))].sort(compareVersions);
}

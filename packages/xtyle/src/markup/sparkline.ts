import type { FullTone } from "../vocab.js";

export type SparklineVariant = "line" | "area" | "bar" | "occupancy";
export type SparklineTone = FullTone;

/** Kind-aware auto y-bounds for a typed metric; see {@link resolveSparklineBounds} for the ranges. */
export type SparklineBounds = "percent" | "unit" | "duration";

/** The host-layout rule for a sparkline, shared by the element's scaffold and the SSR shadow root. */
export const sparklineHostCss = ":host { display: inline-block; }";

function nextPow2(n: number): number {
	if (n <= 1) return 1;
	return 2 ** Math.ceil(Math.log2(n));
}

/**
 * Resolve the effective `{ min, max }` for a sparkline from a `bounds` kind and any explicit overrides.
 * An explicit `min`/`max` always wins; otherwise the kind picks a sensible range for a typed metric —
 * `percent` → `[0, 100]`, `unit` → `[0, 1]`, `duration` → `[0, next power of two ≥ peak]` (so a spike
 * lifts the ceiling instead of squashing the baseline). With no `bounds` the overrides pass through
 * unchanged, and a `null` min/max keeps the fit-to-data default.
 */
export function resolveSparklineBounds(
	values: readonly number[],
	opts: { bounds?: SparklineBounds; min?: number; max?: number },
): { min?: number; max?: number } {
	const { bounds, min, max } = opts;
	if (!bounds) return { min, max };
	if (bounds === "percent") return { min: min ?? 0, max: max ?? 100 };
	if (bounds === "unit") return { min: min ?? 0, max: max ?? 1 };
	const peak = values.length ? Math.max(0, ...values) : 0;
	return { min: min ?? 0, max: max ?? Math.max(1, nextPow2(peak)) };
}

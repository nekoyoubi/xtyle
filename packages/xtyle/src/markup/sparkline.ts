import type { FullTone } from "../vocab.js";
import { SPARKLINE_VARIANTS } from "../vocab.js";

export type SparklineVariant = (typeof SPARKLINE_VARIANTS)[number];
export type SparklineTone = FullTone;

/** Kind-aware auto y-bounds for a typed metric; see {@link resolveSparklineBounds} for the ranges. */
export type SparklineBounds = "percent" | "unit" | "duration";

/** How the hover readout speaks a typed metric's units; see {@link formatSparklineValue}. */
export type SparklineFormat = "percent" | "duration" | "bytes" | "unit";

/** The host-layout rule for a sparkline, shared by the element's scaffold and the SSR shadow root. */
export const sparklineHostCss = ":host { display: inline-block; }";

/** At most two decimals, trailing zeros trimmed — `1.5`, `42`, `0.3`, not `1.50` or `42.0000001`. */
function trimNumber(n: number): string {
	return String(Math.round(n * 100) / 100);
}

/**
 * Format a sparkline hover value in the metric's own units. `duration` reads seconds as `42s` /
 * `1.5m` / `0.3h`, `percent` appends `%`, `bytes` steps through `B`/`KB`/`MB`/… by 1024, and `unit`
 * is a trimmed bare number. With no `format` the raw value passes through unchanged (the default).
 */
export function formatSparklineValue(value: number, format?: SparklineFormat): string {
	switch (format) {
		case "percent":
			return `${trimNumber(value)}%`;
		case "duration": {
			const s = Math.abs(value);
			if (s < 60) return `${trimNumber(value)}s`;
			if (s < 3600) return `${trimNumber(value / 60)}m`;
			return `${trimNumber(value / 3600)}h`;
		}
		case "bytes": {
			const units = ["B", "KB", "MB", "GB", "TB", "PB"];
			let v = value;
			let i = 0;
			while (Math.abs(v) >= 1024 && i < units.length - 1) {
				v /= 1024;
				i++;
			}
			return `${trimNumber(v)} ${units[i]}`;
		}
		case "unit":
			return trimNumber(value);
		default:
			return String(value);
	}
}

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

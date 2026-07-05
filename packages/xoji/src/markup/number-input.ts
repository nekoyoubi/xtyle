/** The host-layout rule for a number input — the one `:host` rule, shared by the element's scaffold and the SSR declarative shadow root. */
export const numberInputHostCss = ":host { display: inline-block; }";

export interface ClampSpec {
	min?: number;
	max?: number;
	/** The grid a stepped value snaps to; ignored when `unstepped`. */
	grid: number;
	/** `step="any"`: keep the value as typed (no snap, no precision cap), only bound it. */
	unstepped: boolean;
}

/**
 * Resolve a committed number: snap to the grid and cap to 6 decimals unless `unstepped`, then clamp
 * into `[min, max]` when either bound is set. `NaN` falls back to `min` (or `0`). Pure and DOM-free.
 */
export function clampNumber(value: number, spec: ClampSpec): number {
	const { min, max, grid, unstepped } = spec;
	if (Number.isNaN(value)) return min ?? 0;
	let v = value;
	if (!unstepped) {
		const base = min ?? 0;
		v = Math.round((v - base) / grid) * grid + base;
	}
	if (min !== undefined) v = Math.max(min, v);
	if (max !== undefined) v = Math.min(max, v);
	return unstepped ? v : Number(v.toFixed(6));
}

/** How an axis's labels are angled: `"auto"` tilts them only when they would collide, or a fixed angle in degrees from `0` (upright) to `-90` (vertical). */
export type LabelAngle = "auto" | number;

/** Reads a `label-angle` attribute or prop: a number of degrees, clamped to `-90..0`, or `"auto"` for anything else. */
export function parseLabelAngle(value: string | number | null | undefined): LabelAngle {
	const n = typeof value === "number" ? value : value == null || value.trim() === "" ? Number.NaN : Number(value);
	return Number.isFinite(n) ? Math.max(-90, Math.min(0, n)) : "auto";
}

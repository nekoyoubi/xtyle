import { clampChroma, converter, formatHex, formatRgb, parse, wcagContrast, type Oklch } from "culori";
import { clamp01, type OklchColor } from "./color.js";

const toOklch = converter("oklch");

export function parseColor(input: string): OklchColor {
	const parsed = parse(input);
	if (!parsed) throw new Error(`xtyle: unparseable color "${input}"`);
	const o = toOklch(parsed) as Oklch | undefined;
	if (!o) throw new Error(`xtyle: cannot convert color "${input}" to oklch`);
	return {
		l: clamp01(o.l ?? 0),
		c: Math.max(0, o.c ?? 0),
		h: o.h ?? 0,
		alpha: o.alpha ?? 1,
	};
}

export function gamutClamp(color: OklchColor): OklchColor {
	const mapped = clampChroma(
		{ mode: "oklch", l: color.l, c: color.c, h: color.h, alpha: color.alpha },
		"oklch",
		"rgb",
	) as Oklch;
	return {
		l: mapped.l ?? color.l,
		c: Math.max(0, mapped.c ?? 0),
		h: mapped.h ?? color.h,
		alpha: mapped.alpha ?? color.alpha,
	};
}

export function formatColor(source: OklchColor): string {
	const color = gamutClamp(source);
	const culoriColor: Oklch = { mode: "oklch", l: color.l, c: color.c, h: color.h, alpha: color.alpha };
	if (color.alpha < 1) return formatRgb(culoriColor) ?? formatHex(culoriColor) ?? "#000000";
	return formatHex(culoriColor) ?? "#000000";
}

export function contrastRatio(a: string, b: string): number {
	return wcagContrast(a, b) ?? 1;
}

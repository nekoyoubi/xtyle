import type { OklchColor } from "./color.js";

interface HostColorMath {
	toOklch(color: string): OklchColor;
	format(l: number, c: number, h: number, alpha: number): string;
	clamp(l: number, c: number, h: number, alpha: number): OklchColor;
	ratio(a: string, b: string): number;
}

declare const cuti: HostColorMath;

export function parseColor(input: string): OklchColor {
	return cuti.toOklch(input);
}

export function gamutClamp(color: OklchColor): OklchColor {
	return cuti.clamp(color.l, color.c, color.h, color.alpha);
}

export function formatColor(source: OklchColor): string {
	return cuti.format(source.l, source.c, source.h, source.alpha);
}

export function contrastRatio(a: string, b: string): number {
	return cuti.ratio(a, b);
}

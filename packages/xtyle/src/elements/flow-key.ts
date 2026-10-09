const MIRRORED: Record<string, string> = { ArrowLeft: "ArrowRight", ArrowRight: "ArrowLeft" };

export function flowKey(key: string, within: Element): string {
	const mirrored = MIRRORED[key];
	if (mirrored === undefined) return key;
	if (typeof getComputedStyle !== "function") return key;
	return getComputedStyle(within).direction === "rtl" ? mirrored : key;
}

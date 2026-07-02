import baseline from "./stats-baseline.json";

function toParts(version: string): number[] {
	return version.split(".").map((part) => Number.parseInt(part, 10) || 0);
}

function isAfter(a: string, b: string): boolean {
	const left = toParts(a);
	const right = toParts(b);
	const length = Math.max(left.length, right.length);
	for (let i = 0; i < length; i++) {
		const diff = (left[i] ?? 0) - (right[i] ?? 0);
		if (diff !== 0) return diff > 0;
	}
	return false;
}

/** True when a component's `since` version sits ahead of the released stats baseline, marking it new for the in-flight cycle. Reads the same baseline the growth chips do, so the "new" badge lights up when a component lands and clears itself the moment the next release re-baselines past it. */
export function isNewComponent(since?: string): boolean {
	if (!since) return false;
	return isAfter(since, baseline.version);
}

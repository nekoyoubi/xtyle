import changelog from "../../../../CHANGELOG.md?raw";
import baseline from "./stats-baseline.json";

function parts(version: string): number[] {
	return version.split(".").map((part) => Number.parseInt(part, 10) || 0);
}

function compare(a: string, b: string): number {
	const left = parts(a);
	const right = parts(b);
	for (let i = 0; i < Math.max(left.length, right.length); i++) {
		const diff = (left[i] ?? 0) - (right[i] ?? 0);
		if (diff !== 0) return diff;
	}
	return 0;
}

/**
 * Every version this project has released, oldest first, read from the changelog's own headers.
 *
 * The catalogue used to take its version axis from the set of versions that *introduced a component*,
 * which silently dropped every release that added none — `0.1.1`, `0.5.0` and `0.7.1` were missing from
 * a chart captioned "per release" and from the "available as of" picker, so a consumer pinned to one of
 * them could not ask what the set looked like when they took it.
 *
 * The in-flight version is excluded: the changelog grows its heading at the start of a cycle, so the
 * section for the version being built is present and unreleased. The stats baseline records the last
 * release, which is exactly the line to cut at.
 */
export function releasedVersions(alsoInclude: readonly string[] = []): string[] {
	const headers = [...changelog.matchAll(/^## v(\d+\.\d+\.\d+)/gm)].map((m) => m[1] as string);
	const released = headers.filter((version) => compare(version, baseline.version) <= 0);
	return [...new Set([...released, ...alsoInclude])].sort(compare);
}

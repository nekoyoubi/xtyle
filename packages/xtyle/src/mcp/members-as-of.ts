import { MEMBER_FIELDS, MEMBERS_SINCE } from "../manifest/members-since.generated.js";
import type { ComponentManifest } from "../manifest/types.js";
import { existedAt } from "./as-of.js";

/** A component manifest answered as of a version, with what was taken out of it. */
export interface ManifestAsOf {
	component: ComponentManifest;
	/** How many members (props, events, parts, examples, …) postdate the version and were left out. */
	omittedMembers: number;
	/** Present when anything was filtered, saying what the filtering does and does not cover. */
	caveat?: string;
}

const memberKey = (entry: unknown): string | null =>
	typeof entry === "string" ? entry : ((entry as { name?: string; id?: string } | null)?.name ?? (entry as { id?: string } | null)?.id ?? null);

/**
 * A manifest with every member that first shipped after `asOf` left out. A member the published
 * versions never carried is dated `speaks`, so a pinned answer never describes something no
 * installable version has.
 *
 * @param manifest the current manifest
 * @param asOf the version answered for
 * @param speaks the version this build describes
 */
export function manifestAsOf(manifest: ComponentManifest, asOf: string, speaks: string): ManifestAsOf {
	if (asOf === speaks) return { component: manifest, omittedMembers: 0 };
	const dates = MEMBERS_SINCE[manifest.id] ?? {};
	const out: Record<string, unknown> = { ...manifest };
	let omitted = 0;
	for (const field of MEMBER_FIELDS) {
		const entries = (manifest as unknown as Record<string, unknown>)[field];
		if (!Array.isArray(entries)) continue;
		const kept = entries.filter((entry) => {
			const key = memberKey(entry);
			const since = (key !== null && dates[field]?.[key]) || speaks;
			return existedAt(since, asOf);
		});
		omitted += entries.length - kept.length;
		out[field] = kept;
	}
	return {
		component: out as unknown as ComponentManifest,
		omittedMembers: omitted,
		...(omitted > 0
			? {
					caveat: `Members are filtered by the version each first shipped in. One that existed at ${asOf} is described as it is in ${speaks}, so a default or a description may have changed since.`,
				}
			: {}),
	};
}

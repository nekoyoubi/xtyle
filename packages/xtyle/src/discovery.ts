import { PACK_KEYWORD } from "./pack.js";

/** The public npm registry, which is the whole index: xtyle hosts none of its own. */
export const NPM_REGISTRY = "https://registry.npmjs.org";

/** One published pack, as the index knows it. A pointer, never the bytes. */
export interface PackSearchHit {
	name: string;
	version: string;
	description?: string;
	keywords: string[];
	publisher?: string;
	date?: string;
	links: { npm?: string; homepage?: string; repository?: string };
}

export interface SearchPacksOptions {
	limit?: number;
	registry?: string;
	fetch?: typeof globalThis.fetch;
}

/**
 * The npm search text a pack query becomes. Always keyword-scoped, so the index is a *view* of npm
 * rather than a second namespace:
 *
 * - `@handle` (no slash) → that author's packs, through npm's maintainer field
 * - `@scope/` or `@scope` with a trailing slash → that scope's packs
 * - anything else → free text alongside the keyword
 *
 * Exported because it is the whole grammar, and a grammar nobody can test without a network is one
 * that drifts.
 */
export function packSearchQuery(query = ""): string {
	const trimmed = query.trim();
	const keyword = `keywords:${PACK_KEYWORD}`;
	if (!trimmed) return keyword;
	if (trimmed.startsWith("@")) {
		const body = trimmed.slice(1);
		if (body.endsWith("/")) return `scope:${body.slice(0, -1)} ${keyword}`;
		if (!body.includes("/")) return `maintainer:${body} ${keyword}`;
	}
	return `${trimmed} ${keyword}`;
}

interface NpmSearchObject {
	package?: {
		name?: string;
		version?: string;
		description?: string;
		keywords?: string[];
		date?: string;
		publisher?: { username?: string };
		links?: Record<string, string>;
	};
}

/**
 * Query the index for published packs. The marketplace and this call are the same query: xtyle.dev
 * is a front end over npm, so a pack is discoverable the moment it publishes with the keyword and
 * there is nothing to register with.
 */
export async function searchPacks(query = "", options: SearchPacksOptions = {}): Promise<PackSearchHit[]> {
	const registry = options.registry ?? NPM_REGISTRY;
	const size = Math.min(Math.max(options.limit ?? 20, 1), 250);
	const url = `${registry}/-/v1/search?text=${encodeURIComponent(packSearchQuery(query))}&size=${size}`;

	const request = options.fetch ?? globalThis.fetch;
	if (!request) throw new Error("xtyle: no fetch available to reach the pack index");

	const response = await request(url);
	if (!response.ok) throw new Error(`xtyle: the pack index answered ${response.status} ${response.statusText}`);

	const body = (await response.json()) as { objects?: NpmSearchObject[] };
	return (body.objects ?? []).flatMap((object) => {
		const found = object.package;
		if (!found?.name || !found.version) return [];
		return [
			{
				name: found.name,
				version: found.version,
				...(found.description ? { description: found.description } : {}),
				keywords: found.keywords ?? [],
				...(found.publisher?.username ? { publisher: found.publisher.username } : {}),
				...(found.date ? { date: found.date } : {}),
				links: {
					...(found.links?.npm ? { npm: found.links.npm } : {}),
					...(found.links?.homepage ? { homepage: found.links.homepage } : {}),
					...(found.links?.repository ? { repository: found.links.repository } : {}),
				},
			},
		];
	});
}

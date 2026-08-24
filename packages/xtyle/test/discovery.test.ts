import { describe, expect, it } from "vitest";
import { NPM_REGISTRY, PACK_KEYWORD, packSearchQuery, searchPacks } from "../src/index.js";

function answer(body: unknown, init: { ok?: boolean; status?: number; statusText?: string } = {}) {
	const calls: string[] = [];
	const fetch = (async (url: string | URL | Request) => {
		calls.push(String(url));
		return {
			ok: init.ok ?? true,
			status: init.status ?? 200,
			statusText: init.statusText ?? "OK",
			json: async () => body,
		} as Response;
	}) as typeof globalThis.fetch;
	return { fetch, calls };
}

describe("pack search query", () => {
	it("scopes every query to the keyword, so the index is a view of npm rather than a namespace", () => {
		expect(packSearchQuery()).toBe(`keywords:${PACK_KEYWORD}`);
		expect(packSearchQuery("brand")).toBe(`brand keywords:${PACK_KEYWORD}`);
	});

	it("reads a bare @handle as an author and @scope/ as a scope", () => {
		expect(packSearchQuery("@someone")).toBe(`maintainer:someone keywords:${PACK_KEYWORD}`);
		expect(packSearchQuery("@someone/")).toBe(`scope:someone keywords:${PACK_KEYWORD}`);
	});

	it("leaves a scoped package name as free text, since it names a package and not an author", () => {
		expect(packSearchQuery("@someone/pack")).toBe(`@someone/pack keywords:${PACK_KEYWORD}`);
	});
});

describe("searchPacks", () => {
	const hit = {
		package: {
			name: "@someone/xtyle-brand",
			version: "1.0.0",
			description: "a pack",
			keywords: [PACK_KEYWORD],
			date: "2026-01-01T00:00:00.000Z",
			publisher: { username: "someone" },
			links: { npm: "https://npmjs.com/package/@someone/xtyle-brand", repository: "https://github.com/someone/x" },
		},
	};

	it("asks the public registry, keyword-scoped and size-bounded", async () => {
		const { fetch, calls } = answer({ objects: [hit] });
		await searchPacks("brand", { fetch, limit: 5 });
		expect(calls[0]).toContain(`${NPM_REGISTRY}/-/v1/search?text=`);
		expect(decodeURIComponent(calls[0] ?? "")).toContain(`brand keywords:${PACK_KEYWORD}`);
		expect(calls[0]).toContain("size=5");
	});

	it("keeps the limit inside what the registry answers", async () => {
		const { fetch, calls } = answer({ objects: [] });
		await searchPacks("", { fetch, limit: 9000 });
		expect(calls[0]).toContain("size=250");
	});

	it("returns pointers, never bytes", async () => {
		const { fetch } = answer({ objects: [hit] });
		const [found] = await searchPacks("brand", { fetch });
		expect(found).toMatchObject({ name: "@someone/xtyle-brand", version: "1.0.0", publisher: "someone" });
		expect(found?.links.repository).toContain("github.com");
	});

	it("drops an index row that names no package rather than inventing one", async () => {
		const { fetch } = answer({ objects: [{ package: { name: "nameless" } }, {}, hit] });
		expect(await searchPacks("", { fetch })).toHaveLength(1);
	});

	it("says the index failed rather than reporting an empty shelf", async () => {
		const { fetch } = answer({}, { ok: false, status: 503, statusText: "Service Unavailable" });
		await expect(searchPacks("brand", { fetch })).rejects.toThrow(/503/);
	});

	it("survives an index answering no objects at all", async () => {
		const { fetch } = answer({});
		expect(await searchPacks("", { fetch })).toEqual([]);
	});
});

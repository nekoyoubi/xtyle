import { describe, expect, it } from "vitest";
import {
	PACK_KEYWORD,
	packEntries,
	packInstallSpec,
	parsePackManifest,
	parsePackRef,
	selectPackEntry,
} from "../src/index.js";

describe("pack reference grammar", () => {
	it("reads a bare name and a scoped name as npm packages", () => {
		expect(parsePackRef("xtyle-brand")).toMatchObject({ kind: "npm", target: "xtyle-brand" });
		expect(parsePackRef("@someone/xtyle-brand")).toMatchObject({ kind: "npm", target: "@someone/xtyle-brand" });
	});

	it("pins a version in the @ position, scoped or not", () => {
		expect(parsePackRef("xtyle-brand@1.2.3")).toMatchObject({ kind: "npm", target: "xtyle-brand", version: "1.2.3" });
		expect(parsePackRef("@someone/pack@^2")).toMatchObject({ kind: "npm", target: "@someone/pack", version: "^2" });
	});

	it("reads one slash without a scope as a GitHub repo, and its @ as a committish", () => {
		expect(parsePackRef("someone/xtyle-brand")).toMatchObject({ kind: "github", target: "someone/xtyle-brand" });
		expect(parsePackRef("someone/xtyle-brand@main")).toMatchObject({ kind: "github", version: "main" });
	});

	it("reads a path and a URL by their own shapes", () => {
		expect(parsePackRef("./packs/mine")).toMatchObject({ kind: "path", target: "./packs/mine" });
		expect(parsePackRef("../mine")).toMatchObject({ kind: "path" });
		expect(parsePackRef("/srv/packs/mine")).toMatchObject({ kind: "path" });
		expect(parsePackRef("C:\\packs\\mine")).toMatchObject({ kind: "path" });
		expect(parsePackRef("https://example.com/pack.tgz")).toMatchObject({ kind: "url" });
		expect(parsePackRef("file:./pack.tgz")).toMatchObject({ kind: "url" });
	});

	it("reads a bare @handle as an author, and a scope only when a slash follows", () => {
		expect(parsePackRef("@someone")).toMatchObject({ kind: "author", target: "@someone" });
		expect(parsePackRef("@someone/pack")).toMatchObject({ kind: "npm" });
	});

	it("takes #name as the entry selector on every shape, not as a git committish", () => {
		for (const raw of ["pkg#warm", "@s/pkg#warm", "owner/repo#warm", "./here#warm", "https://x/y.tgz#warm"]) {
			expect(parsePackRef(raw).select, raw).toBe("warm");
		}
	});

	it("refuses references that name nothing, or that carry characters no package spec has", () => {
		expect(() => parsePackRef("")).toThrow();
		expect(() => parsePackRef("pkg#")).toThrow();
		expect(() => parsePackRef("pkg@")).toThrow();
		expect(() => parsePackRef("@someone@1.0.0")).toThrow(/author/);
		expect(() => parsePackRef("pkg && rm -rf /")).toThrow(/not a pack reference/);
		expect(() => parsePackRef('pkg" | curl x')).toThrow(/not a pack reference/);
	});

	it("hands the package manager a spec it understands, translating the committish back", () => {
		expect(packInstallSpec(parsePackRef("@s/pkg@1.0.0#warm"))).toBe("@s/pkg@1.0.0");
		expect(packInstallSpec(parsePackRef("owner/repo@main"))).toBe("owner/repo#main");
		expect(packInstallSpec(parsePackRef("./here"))).toBe("./here");
		expect(() => packInstallSpec(parsePackRef("@someone"))).toThrow(/author/);
	});
});

describe("pack manifest", () => {
	const source = {
		name: "@someone/xtyle-brand",
		version: "2.0.0",
		keywords: [PACK_KEYWORD],
		xtyle: {
			algorithms: [{ name: "brand-warm", entry: "./algorithms/warm", description: "warm" }],
			themes: [{ name: "dusk", entry: "./themes/dusk.theme.json" }],
		},
	};

	it("reads the block out of a package.json and names the pack from the package", () => {
		const { pack, problems } = parsePackManifest(source, { name: source.name, version: source.version });
		expect(problems).toEqual([]);
		expect(pack?.name).toBe("@someone/xtyle-brand");
		expect(pack?.version).toBe("2.0.0");
		expect(pack?.algorithms[0]).toMatchObject({ name: "brand-warm", kind: "algorithm", entry: "./algorithms/warm" });
		expect(pack?.themes[0]).toMatchObject({ name: "dusk", kind: "theme" });
	});

	it("reads the same block standing alone, as an xtyle.json is", () => {
		const { pack } = parsePackManifest(source.xtyle, { name: "@someone/xtyle-brand", standalone: true });
		expect(pack?.algorithms).toHaveLength(1);
		expect(pack?.themes).toHaveLength(1);
	});

	it("answers null for a package that declares no pack at all", () => {
		expect(parsePackManifest({ name: "is-odd", version: "3.0.1" }).pack).toBeNull();
		expect(parsePackManifest("not an object").pack).toBeNull();
		expect(parsePackManifest(null).pack).toBeNull();
	});

	it("does not read a package.json's own top-level themes as a pack, since only the caller knows the file", () => {
		expect(parsePackManifest({ name: "some-cms", themes: ["dark", "light"] }).pack).toBeNull();
		expect(parsePackManifest({ name: "some-cms", themes: ["dark"] }, { standalone: true }).pack).not.toBeNull();
	});

	it("takes an entry's kind from the list it sits in, so a theme cannot claim to be an algorithm", () => {
		const { pack } = parsePackManifest(
			{ xtyle: { themes: [{ name: "dusk", entry: "./d.json", kind: "algorithm" }] } },
			{ name: "p" },
		);
		expect(pack?.algorithms).toEqual([]);
		expect(pack?.themes[0]?.kind).toBe("theme");
	});

	it("drops the entry that is malformed and keeps the rest, because a scan reads every pack in one pass", () => {
		const { pack, problems } = parsePackManifest(
			{
				xtyle: {
					algorithms: [
						{ name: "good", entry: "./good" },
						{ entry: "./nameless" },
						{ name: "homeless" },
						{ name: "good", entry: "./twice" },
						"not an entry",
					],
				},
			},
			{ name: "p" },
		);
		expect(pack?.algorithms.map((entry) => entry.name)).toEqual(["good"]);
		expect(problems).toHaveLength(4);
		expect(problems.join(" ")).toContain("repeats the name");
	});

	it("says so when a pack declares nothing, rather than registering an empty pack quietly", () => {
		const { pack, problems } = parsePackManifest({ xtyle: { algorithms: [] } }, { name: "p" });
		expect(pack?.algorithms).toEqual([]);
		expect(problems.join(" ")).toContain("nothing to register");
	});

	it("selects one declared entry by manifest name, across both kinds", () => {
		const { pack } = parsePackManifest(source, { name: source.name });
		expect(packEntries(pack!).map((entry) => entry.name)).toEqual(["brand-warm", "dusk"]);
		expect(selectPackEntry(pack!, "dusk")?.kind).toBe("theme");
		expect(selectPackEntry(pack!, "brand-warm")?.kind).toBe("algorithm");
		expect(selectPackEntry(pack!, "absent")).toBeNull();
	});
});

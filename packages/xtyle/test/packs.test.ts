import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { discoverInstalledPacks, packEntryPath, readInstalledPack, resolvePackTheme } from "../src/host/packs.js";
import { buildThemeFile, derive, serializeThemeFile } from "../src/index.js";
import { xtyleDefault } from "../src/batteries.js";

let root: string;
let project: string;

function write(path: string, value: unknown): void {
	mkdirSync(join(path, ".."), { recursive: true });
	writeFileSync(path, typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`);
}

function pkg(dir: string, body: Record<string, unknown>): string {
	mkdirSync(dir, { recursive: true });
	write(join(dir, "package.json"), body);
	return dir;
}

beforeAll(() => {
	root = mkdtempSync(join(tmpdir(), "xtyle-packs-"));
	project = pkg(join(root, "project"), {
		name: "consumer",
		version: "0.0.0",
		dependencies: { "@someone/brand": "^1.0.0", "is-odd": "^3.0.0" },
		devDependencies: { "@someone/dev-only": "^1.0.0" },
	});

	const brand = pkg(join(project, "node_modules", "@someone", "brand"), {
		name: "@someone/brand",
		version: "1.4.0",
		xtyle: {
			algorithms: [{ name: "brand-warm", entry: "./algorithms/warm" }],
			themes: [{ name: "dusk", entry: "./themes/dusk.theme.json" }],
		},
	});
	const register = derive(xtyleDefault, { constraints: { "--bg-0": "#1a1420", "--accent": "#8b5cf6" } });
	write(
		join(brand, "themes", "dusk.theme.json"),
		serializeThemeFile(
			buildThemeFile({
				meta: { name: "Dusk" },
				recipe: { algorithm: "xtyle-default", overrides: { "--bg-0": "#1a1420", "--accent": "#8b5cf6" } },
				register,
			}),
		),
	);

	pkg(join(project, "node_modules", "@someone", "dev-only"), {
		name: "@someone/dev-only",
		version: "0.1.0",
		xtyle: { themes: [{ name: "night", entry: "./night.theme.json" }] },
	});
	pkg(join(project, "node_modules", "is-odd"), { name: "is-odd", version: "3.0.1" });
	pkg(join(project, "node_modules", "@someone", "undeclared"), {
		name: "@someone/undeclared",
		version: "1.0.0",
		xtyle: { themes: [{ name: "ghost", entry: "./ghost.theme.json" }] },
	});
});

afterAll(() => {
	rmSync(root, { recursive: true, force: true });
});

describe("reading a pack off disk", () => {
	it("reads the block out of a package's own package.json", () => {
		const installed = readInstalledPack(join(project, "node_modules", "@someone", "brand"));
		expect(installed?.pack.name).toBe("@someone/brand");
		expect(installed?.pack.version).toBe("1.4.0");
		expect(installed?.pack.algorithms[0]?.name).toBe("brand-warm");
	});

	it("prefers a standalone xtyle.json, so a pack that wrote one is not overruled by the field", () => {
		const dir = pkg(join(root, "standalone"), {
			name: "@someone/both",
			version: "1.0.0",
			xtyle: { themes: [{ name: "from-the-field", entry: "./a.json" }] },
		});
		write(join(dir, "xtyle.json"), { themes: [{ name: "from-the-file", entry: "./b.json" }] });
		expect(readInstalledPack(dir)?.pack.themes[0]?.name).toBe("from-the-file");
	});

	it("answers null for a package that declares no pack", () => {
		expect(readInstalledPack(join(project, "node_modules", "is-odd"))).toBeNull();
	});

	it("resolves an entry against the pack's own directory", () => {
		const installed = readInstalledPack(join(project, "node_modules", "@someone", "brand"));
		expect(packEntryPath(installed!, installed!.pack.algorithms[0]!)).toContain(join("brand", "algorithms", "warm"));
	});
});

describe("discovering the packs a project declares", () => {
	it("finds every declared dependency that carries a pack", () => {
		const names = discoverInstalledPacks(project).map((installed) => installed.pack.name);
		expect(names).toContain("@someone/brand");
		expect(names).toContain("@someone/dev-only");
	});

	it("walks past a dependency that declares no pack", () => {
		expect(discoverInstalledPacks(project).map((installed) => installed.pack.name)).not.toContain("is-odd");
	});

	it("ignores a pack sitting in node_modules that the project never asked for", () => {
		expect(discoverInstalledPacks(project).map((installed) => installed.pack.name)).not.toContain("@someone/undeclared");
	});

	it("counts the project itself when it declares a pack, so an author can derive before publishing", () => {
		const author = pkg(join(root, "author"), {
			name: "@someone/mine",
			version: "0.0.1",
			xtyle: { algorithms: [{ name: "mine", entry: "./mine" }] },
		});
		expect(discoverInstalledPacks(author).map((installed) => installed.pack.name)).toEqual(["@someone/mine"]);
	});

	it("reports nothing rather than throwing when there is no project at all", () => {
		expect(discoverInstalledPacks(mkdtempSync(join(tmpdir(), "xtyle-empty-")))).toEqual([]);
	});
});

describe("resolving a theme a pack declares", () => {
	it("finds a theme by its manifest name, not by its path", () => {
		const found = resolvePackTheme("dusk", project);
		expect(found?.pack).toBe("@someone/brand");
		expect(found?.theme.recipe.algorithm).toBe("xtyle-default");
		expect(found?.theme.tokens["--accent"]).toBe("#8b5cf6");
	});

	it("takes a <pack>/<name> to disambiguate, and refuses the wrong pack's name", () => {
		expect(resolvePackTheme("@someone/brand/dusk", project)?.pack).toBe("@someone/brand");
		expect(resolvePackTheme("@someone/dev-only/dusk", project)).toBeNull();
	});

	it("answers null for a name nobody declares", () => {
		expect(resolvePackTheme("absent", project)).toBeNull();
	});

	it("says so when the declared file is not a theme, rather than deriving something else", () => {
		const dir = pkg(join(root, "broken"), {
			name: "@someone/broken",
			version: "1.0.0",
			xtyle: { themes: [{ name: "wrong", entry: "./wrong.json" }] },
		});
		write(join(dir, "wrong.json"), { not: "a theme" });
		expect(() => resolvePackTheme("wrong", dir)).toThrow(/not an xtyle theme file/);
	});
});

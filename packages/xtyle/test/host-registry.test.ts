import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it, vi } from "vitest";
import {
	algorithmManifest,
	availableAlgorithms,
	defaultAlgorithm,
	discoverAlgorithmMods,
	resolveAlgorithm,
	resolveInstalledAlgorithm,
	snapshotAlgorithm,
} from "../src/host/registry.js";
import { bundledAlgorithms } from "../src/host/bundle.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const ALGORITHMS_DIR = join(ROOT, "algorithms");

/** Every algorithm on disk, read the way a stranger would: whatever directories are there. */
function modDirsOnDisk(): string[] {
	return readdirSync(ALGORITHMS_DIR, { withFileTypes: true })
		.filter((e) => e.isDirectory() && existsSync(join(ALGORITHMS_DIR, e.name, "mod-manifest.json")))
		.map((e) => e.name);
}

function manifestNameOf(dir: string): string {
	return JSON.parse(readFileSync(join(ALGORITHMS_DIR, dir, "mod-manifest.json"), "utf8")).name as string;
}

/** A throwaway algorithms root, so the scan can be exercised on packs that are not ours. */
const scratch = mkdtempSync(join(tmpdir(), "xtyle-mods-"));
afterAll(() => rmSync(scratch, { recursive: true, force: true }));

function fixtureMod(dir: string, name: string | undefined, opts: { script?: boolean } = {}): string {
	const root = mkdtempSync(join(scratch, "root-"));
	writeMod(root, dir, name, opts);
	return root;
}

function writeMod(root: string, dir: string, name: string | undefined, { script = true }: { script?: boolean } = {}): void {
	const path = join(root, dir);
	mkdirSync(join(path, "src"), { recursive: true });
	writeFileSync(
		join(path, "mod-manifest.json"),
		JSON.stringify({ xript: "0.7", ...(name ? { name } : {}), entry: { script: "src/mod.js", format: "script" } }),
	);
	if (script) writeFileSync(join(path, "src", "mod.js"), "");
}

describe("the scan reads whatever is installed, not what it was told to expect", () => {
	it("finds a mod it has never heard of, keyed by the name its manifest declares", () => {
		const root = fixtureMod("some-pack", "some-pack");
		expect([...discoverAlgorithmMods(root).keys()]).toEqual(["some-pack"]);
	});

	// The id is the manifest name, permanently: it is what a theme file's `algorithm` field records, so
	// the directory a pack happens to be unpacked into can never be allowed to decide it.
	it("takes the id from the manifest name even when the directory disagrees", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const root = fixtureMod("node_modules-ish-dir", "cool-theme");
		const mods = discoverAlgorithmMods(root);
		expect([...mods.keys()]).toEqual(["cool-theme"]);
		expect(mods.get("cool-theme")?.dir).toBe("node_modules-ish-dir");
		expect(warn).toHaveBeenCalled();
		warn.mockRestore();
	});

	it("skips a directory that is not a mod, and one whose entry script was never built", () => {
		const root = fixtureMod("built", "built");
		mkdirSync(join(root, "just-a-folder"), { recursive: true });
		writeMod(root, "unbuilt", "unbuilt", { script: false });
		expect([...discoverAlgorithmMods(root).keys()]).toEqual(["built"]);
	});

	it("refuses two packs that claim the same id, rather than letting one shadow the other", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		const root = fixtureMod("first", "clash");
		writeMod(root, "second", "clash");
		expect(() => discoverAlgorithmMods(root)).toThrow(/two mods claim the algorithm id "clash"/);
		warn.mockRestore();
	});

	it("refuses a mod that declares no name, because it would have no id", () => {
		const root = fixtureMod("nameless", undefined);
		expect(() => discoverAlgorithmMods(root)).toThrow(/declares no name/);
	});
});

describe("the registry discovers algorithms rather than listing them", () => {
	// The bug this pins: the browser's id list was scan-derived while Node's was a hand-kept map, so a
	// sixth algorithm dropped into `algorithms/` resolved in the browser and did not exist to the CLI.
	it("resolves every mod on disk, with no hand-kept allow-list to fall out of date", () => {
		expect([...availableAlgorithms()].sort()).toEqual(modDirsOnDisk().map(manifestNameOf).sort());
	});

	it("agrees with the browser bundle about which algorithms exist", () => {
		expect([...availableAlgorithms()].sort()).toEqual([...bundledAlgorithms()].sort());
	});

	it("leads with the default, so a listing opens on the algorithm an id-less caller gets", () => {
		expect(availableAlgorithms()[0]).toBe(defaultAlgorithm());
	});

	// An id is the mod manifest's `name` — it is what `Algorithm.id` carries, what a theme file records
	// forever, and what every cache keys on. The directory is a filesystem detail.
	it("takes an algorithm's id from its manifest name, not its directory", async () => {
		for (const dir of modDirsOnDisk()) {
			const id = manifestNameOf(dir);
			expect(availableAlgorithms()).toContain(id);
			expect((await resolveInstalledAlgorithm(id)).id).toBe(id);
		}
	}, 60_000);

	it("names the algorithms it does have when asked for one it does not", async () => {
		await expect(resolveInstalledAlgorithm("not-a-mod")).rejects.toThrow(
			new RegExp(`no algorithm "not-a-mod" in .*installed:.*${defaultAlgorithm()}`),
		);
	});

	// `@xtyle/core/algorithms` exports a `resolveAlgorithm` too, and it needs no filesystem. Importing
	// this one where that one was meant is silent in a checkout — the walk-up finds the repo's own
	// `algorithms/` either way — and fatal in a published install, so the failure has to hand the
	// caller the other path by name rather than naming a directory they cannot create.
	it("points at the filesystem-free twin when there is no algorithms/ directory at all", async () => {
		// Kept inline rather than hoisted to a helper: the published-install shape is only reachable by
		// mocking the walk-up's `existsSync` before a *fresh* copy of the registry memoizes its root, and
		// a setup this coupled to one assertion is a hazard sitting a hundred lines from its only caller.
		vi.resetModules();
		const fs = await vi.importActual<typeof import("node:fs")>("node:fs");
		vi.doMock("node:fs", () => ({
			...fs,
			existsSync: (path: Parameters<typeof fs.existsSync>[0]) =>
				String(path).includes("mod-manifest.json") ? false : fs.existsSync(path),
		}));
		const { resolveInstalledAlgorithm: fresh } = await import("../src/host/registry.js");
		vi.doUnmock("node:fs");
		vi.resetModules();

		await expect(fresh(defaultAlgorithm())).rejects.toThrow(/@xtyle\/core\/algorithms/);
		await expect(fresh(defaultAlgorithm())).rejects.not.toThrow(/could not locate/);
	});

	// `resolveAlgorithm` was this module's export name for its whole published life, so the alias is a
	// compatibility promise rather than a convenience. Pinned to the same function object: a
	// reimplementation that drifted from the real one would be worse than no alias at all.
	it("keeps the old name working as an alias of the same function", () => {
		expect(resolveAlgorithm).toBe(resolveInstalledAlgorithm);
	});

	// The bundle is the only thing a published consumer can resolve against, so an algorithm added to
	// `algorithms/` without a rebuild of the generated bundle would resolve in this repo forever while
	// being invisible to everyone who installed the package.
	it("embeds every algorithm that exists on disk, so none is resolvable in-repo only", () => {
		expect([...bundledAlgorithms()].sort()).toEqual(modDirsOnDisk().map(manifestNameOf).sort());
	});
});

describe("an algorithm's manifest is readable without running it", () => {
	// Listing what a pack accepts is the cheapest question a consumer asks; before the static block it
	// was the most expensive, because the only way to answer it was to boot a QuickJS runtime per
	// algorithm — for every third-party pack in a discovery index.
	it("reads produces / knobs / invariantCount off the packaged manifest, no sandbox", () => {
		for (const id of availableAlgorithms()) {
			const declared = algorithmManifest(id);
			expect(declared, `${id} ships no static manifest block`).not.toBeNull();
			expect(declared?.knobs.length).toBeGreaterThan(0);
			expect(declared?.produces.length).toBeGreaterThan(0);
			expect(declared?.invariantCount).toBeGreaterThan(0);
		}
	});

	it("declares the same thing the running algorithm reports", async () => {
		const id = defaultAlgorithm();
		const declared = algorithmManifest(id);
		const running = await resolveInstalledAlgorithm(id);
		expect(declared?.knobs).toEqual(running.knobs);
		expect(declared?.produces).toEqual(running.produces);
		expect(declared?.invariantCount).toBe(running.invariants.length);
		expect(declared?.passNames).toEqual(running.passes?.map((p) => p.name));
	}, 60_000);

	it("has no manifest for an algorithm it cannot resolve", () => {
		expect(algorithmManifest("not-a-mod")).toBeNull();
	});
});

describe("host registry snapshot", () => {
	it("snapshots a resolved mod synchronously, null until then", async () => {
		const algorithm = await resolveInstalledAlgorithm("xtyle-default");
		expect(snapshotAlgorithm("xtyle-default")).toBe(algorithm);
		expect(snapshotAlgorithm("nonexistent")).toBeNull();
	});

	it("returns the same cached instance as resolveInstalledAlgorithm", async () => {
		const first = await resolveInstalledAlgorithm("xtyle-quiet");
		const second = await resolveInstalledAlgorithm("xtyle-quiet");
		expect(second).toBe(first);
		expect(snapshotAlgorithm("xtyle-quiet")).toBe(first);
	});
});

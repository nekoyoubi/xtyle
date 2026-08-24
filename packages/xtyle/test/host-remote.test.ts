import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { derive, getAlgorithm } from "../src/batteries.js";
import { parsePackRef } from "../src/pack.js";
import {
	PACK_CDN,
	fetchPack,
	fetchPackAlgorithm,
	fetchPackAlgorithmManifest,
	fetchPackAlgorithms,
	fetchPackTheme,
	packBaseUrl,
} from "../src/host/remote.js";

const ALGORITHMS = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "algorithms");
const MOD_MANIFEST = readFileSync(join(ALGORITHMS, "xtyle-default", "mod-manifest.json"), "utf8");
const MOD_SOURCE = readFileSync(join(ALGORITHMS, "xtyle-default", "src", "mod.js"), "utf8");
const HC_MANIFEST = readFileSync(join(ALGORITHMS, "xtyle-hc", "mod-manifest.json"), "utf8");
const HC_SOURCE = readFileSync(join(ALGORITHMS, "xtyle-hc", "src", "mod.js"), "utf8");

const constraints = { "--bg-0": "#0b0d12", "--fg-0": "#e6e9ef", "--accent": "#6ea8fe" };

const THEME = JSON.stringify({
	format: "xtyle-theme",
	version: 1,
	meta: { name: "Dusk" },
	recipe: { algorithm: "xtyle-default", knobs: { scheme: "dark" } },
});

function pack(entries: { algorithms?: unknown[]; themes?: unknown[] } = {}): string {
	return JSON.stringify({
		name: "@demo/pack",
		version: "1.0.0",
		xtyle: {
			description: "a pack served over http",
			algorithms: entries.algorithms ?? [{ name: "xtyle-default", entry: "algo" }],
			...(entries.themes ? { themes: entries.themes } : {}),
		},
	});
}

function serve(files: Record<string, string>): typeof globalThis.fetch {
	return vi.fn(async (input: RequestInfo | URL) => {
		const url = String(input);
		const body = files[url];
		if (body === undefined) return new Response("not found", { status: 404, statusText: "Not Found" });
		return new Response(body, { status: 200 });
	}) as unknown as typeof globalThis.fetch;
}

let scenarios = 0;

function servedAtOwnRoot(overrides: (root: string) => Record<string, string> = () => ({})): { root: string; fetch: typeof globalThis.fetch } {
	const root = `https://packs.test/demo-${++scenarios}/`;
	return {
		root,
		fetch: serve({
			[`${root}package.json`]: pack(),
			[`${root}algo/mod-manifest.json`]: MOD_MANIFEST,
			[`${root}algo/src/mod.js`]: MOD_SOURCE,
			...overrides(root),
		}),
	};
}

function calls(fetch: typeof globalThis.fetch): string[] {
	return (fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls.map((call) => String(call[0]));
}

describe("where a pack's files are read from", () => {
	it("maps an npm reference onto the CDN, version and all", () => {
		expect(packBaseUrl(parsePackRef("xtyle-brand"))).toBe(`${PACK_CDN}/npm/xtyle-brand/`);
		expect(packBaseUrl(parsePackRef("@someone/pack@1.2.3"))).toBe(`${PACK_CDN}/npm/@someone/pack@1.2.3/`);
	});

	it("maps a github reference onto the CDN's gh path, committish and all", () => {
		expect(packBaseUrl(parsePackRef("someone/pack"))).toBe(`${PACK_CDN}/gh/someone/pack/`);
		expect(packBaseUrl(parsePackRef("someone/pack@main"))).toBe(`${PACK_CDN}/gh/someone/pack@main/`);
	});

	it("takes a URL reference as the directory the pack is served from", () => {
		expect(packBaseUrl(parsePackRef("https://example.test/pack"))).toBe("https://example.test/pack/");
		expect(packBaseUrl(parsePackRef("https://example.test/pack/"))).toBe("https://example.test/pack/");
	});

	it("honors an overridden CDN", () => {
		expect(packBaseUrl(parsePackRef("pack"), "https://cdn.example.test")).toBe("https://cdn.example.test/npm/pack/");
	});

	it("refuses the shapes that have no URL to answer with", () => {
		expect(() => packBaseUrl(parsePackRef("./local/pack"))).toThrow(/needs a filesystem/);
		expect(() => packBaseUrl(parsePackRef("@someone"))).toThrow(/is an author rather than a pack/);
		expect(() => packBaseUrl(parsePackRef("https://example.test/pack.tgz"))).toThrow(/points at an archive/);
	});

	it("refuses a scheme a pack cannot be fetched over", () => {
		expect(() => packBaseUrl(parsePackRef("ftp://example.test/pack"))).toThrow(/read over http or https/);
		expect(() => packBaseUrl(parsePackRef("file://example.test/pack"))).toThrow(/read over http or https/);
	});

	it("normalizes the base, so an entry still resolves inside a pack whose URL took the long way", () => {
		expect(packBaseUrl(parsePackRef("https://example.test/a/./b"))).toBe("https://example.test/a/b/");
		expect(packBaseUrl(parsePackRef("https://example.test/pack?v=1"))).toBe("https://example.test/pack/");
	});
});

describe("reading what a remote pack declares", () => {
	it("reads the package.json block and reports where entries resolve from", async () => {
		const { root, fetch } = servedAtOwnRoot();
		const remote = await fetchPack(root, { fetch });
		expect(remote.pack.name).toBe("@demo/pack");
		expect(remote.pack.version).toBe("1.0.0");
		expect(remote.pack.algorithms).toEqual([{ name: "xtyle-default", kind: "algorithm", entry: "algo" }]);
		expect(remote.base).toBe(root);
		expect(remote.problems).toEqual([]);
	});

	it("prefers a standalone xtyle.json, as the disk resolver does", async () => {
		const { root, fetch } = servedAtOwnRoot((at) => ({
			[`${at}xtyle.json`]: JSON.stringify({ name: "@demo/standalone", algorithms: [{ name: "xtyle-default", entry: "algo" }] }),
		}));
		expect((await fetchPack(root, { fetch })).pack.name).toBe("@demo/standalone");
	});

	it("keeps a malformed entry from costing the rest of the pack", async () => {
		const { root, fetch } = servedAtOwnRoot((at) => ({
			[`${at}package.json`]: pack({ algorithms: [{ name: "nameless" }, { name: "xtyle-default", entry: "algo" }] }),
		}));
		const remote = await fetchPack(root, { fetch });
		expect(remote.problems).toEqual([expect.stringContaining("declares no entry")]);
		expect(remote.pack.algorithms.map((entry) => entry.name)).toEqual(["xtyle-default"]);
	});

	it("says so when nothing at the address is a pack", async () => {
		const at = "https://packs.test/ordinary/";
		await expect(fetchPack(at, { fetch: serve({ [`${at}package.json`]: JSON.stringify({ name: "ordinary" }) }) })).rejects.toThrow(
			/declares an xtyle pack/,
		);
	});

	it("reports a CDN that is failing rather than reading it as an absent pack", async () => {
		const fetch = vi.fn(async () => new Response("boom", { status: 503, statusText: "Service Unavailable" })) as unknown as typeof globalThis.fetch;
		await expect(fetchPack("https://packs.test/down/", { fetch })).rejects.toThrow(/answered 503/);
	});
});

describe("loading a published algorithm through the sandbox", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("derives byte-identical to the baked oracle", async () => {
		const { root, fetch } = servedAtOwnRoot();
		const algorithm = await fetchPackAlgorithm(root, { fetch });
		expect(algorithm.id).toBe("xtyle-default");
		expect(derive(algorithm, { constraints })).toEqual(derive(getAlgorithm("xtyle-default"), { constraints }));
	});

	it("takes the entry a #selector names", async () => {
		const { root, fetch } = servedAtOwnRoot((at) => ({
			[`${at}package.json`]: pack({
				algorithms: [
					{ name: "xtyle-default", entry: "algo" },
					{ name: "xtyle-hc", entry: "hc" },
				],
			}),
			[`${at}hc/mod-manifest.json`]: HC_MANIFEST,
			[`${at}hc/src/mod.js`]: HC_SOURCE,
		}));
		expect((await fetchPackAlgorithm(`${root}#xtyle-hc`, { fetch })).id).toBe("xtyle-hc");
	});

	it("refuses to guess when a pack declares several and none is named", async () => {
		const { root, fetch } = servedAtOwnRoot((at) => ({
			[`${at}package.json`]: pack({
				algorithms: [
					{ name: "xtyle-default", entry: "algo" },
					{ name: "xtyle-hc", entry: "hc" },
				],
			}),
		}));
		await expect(fetchPackAlgorithm(root, { fetch })).rejects.toThrow(/declares 2 algorithms/);
	});

	it("names what the pack does declare when the selector matches nothing", async () => {
		const { root, fetch } = servedAtOwnRoot();
		await expect(fetchPackAlgorithm(`${root}#nope`, { fetch })).rejects.toThrow(/it has: xtyle-default/);
	});

	it("refuses an entry that climbs out of the pack", async () => {
		const { root, fetch } = servedAtOwnRoot((at) => ({ [`${at}package.json`]: pack({ algorithms: [{ name: "escape", entry: "../../secrets" }] }) }));
		await expect(fetchPackAlgorithm(root, { fetch })).rejects.toThrow(/outside the pack/);
	});

	it("says where it looked when an entry holds no mod", async () => {
		const at = "https://packs.test/hollow/";
		await expect(fetchPackAlgorithm(at, { fetch: serve({ [`${at}package.json`]: pack() }) })).rejects.toThrow(/there is no mod-manifest\.json/);
	});

	it("warns when the mod's own name disagrees with the name the pack declared", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const { root, fetch } = servedAtOwnRoot((at) => ({ [`${at}package.json`]: pack({ algorithms: [{ name: "misnamed", entry: "algo" }] }) }));
		const algorithm = await fetchPackAlgorithm(root, { fetch });
		expect(algorithm.id).toBe("xtyle-default");
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('calls itself "xtyle-default"'));
	});

	it("fetches a mod once across repeat resolutions", async () => {
		const { root, fetch } = servedAtOwnRoot();
		await fetchPackAlgorithm(root, { fetch });
		expect(calls(fetch)).toContain(`${root}algo/src/mod.js`);
		await fetchPackAlgorithm(root, { fetch });
		expect(calls(fetch).filter((url) => url === `${root}algo/src/mod.js`)).toHaveLength(1);
	});

	it("reads a pack's manifest once, so repeat resolutions cost no round trips", async () => {
		const { root, fetch } = servedAtOwnRoot();
		await fetchPackAlgorithm(root, { fetch });
		await fetchPackAlgorithm(root, { fetch });
		await fetchPack(root, { fetch });
		expect(calls(fetch).filter((url) => url === `${root}package.json`)).toHaveLength(1);
		expect(calls(fetch).filter((url) => url.endsWith("/xtyle.json"))).toHaveLength(1);
	});

	it("keeps one caller's fetch from being served another's answer", async () => {
		const at = "https://packs.test/shared-address/";
		const mine = serve({ [`${at}package.json`]: pack({ algorithms: [{ name: "mine", entry: "a" }] }) });
		const yours = serve({ [`${at}package.json`]: pack({ algorithms: [{ name: "yours", entry: "a" }] }) });

		expect((await fetchPack(at, { fetch: mine })).pack.algorithms[0]?.name).toBe("mine");
		expect((await fetchPack(at, { fetch: yours })).pack.algorithms[0]?.name).toBe("yours");
	});

	it("does not cache a read that failed, so a pack published later still resolves", async () => {
		const at = "https://packs.test/late/";
		let published = false;
		const fetch = vi.fn(async (input: RequestInfo | URL) => {
			if (published && String(input) === `${at}package.json`) return new Response(pack(), { status: 200 });
			return new Response("not found", { status: 404, statusText: "Not Found" });
		}) as unknown as typeof globalThis.fetch;

		await expect(fetchPack(at, { fetch })).rejects.toThrow(/declares an xtyle pack/);
		published = true;
		expect((await fetchPack(at, { fetch })).pack.name).toBe("@demo/pack");
	});

	it("loads every algorithm a pack declares, and lets one failure cost only itself", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const { root, fetch } = servedAtOwnRoot((at) => ({
			[`${at}package.json`]: pack({
				algorithms: [
					{ name: "broken", entry: "missing" },
					{ name: "xtyle-default", entry: "algo" },
				],
			}),
		}));
		const resolved = await fetchPackAlgorithms(root, { fetch });
		expect(resolved.map((entry) => entry.declared)).toEqual(["xtyle-default"]);
		expect(resolved[0]?.pack).toBe("@demo/pack");
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('declares algorithm "broken", which did not load'));
	});
});

describe("reading a published algorithm without running it", () => {
	it("answers the static manifest off the packaged mod, with no sandbox boot", async () => {
		const { root, fetch } = servedAtOwnRoot();
		const manifest = await fetchPackAlgorithmManifest(root, { fetch });
		expect(manifest?.knobs).toEqual(getAlgorithm("xtyle-default").knobs);
		expect(manifest?.produces.length).toBeGreaterThan(0);
		expect(calls(fetch)).not.toContain(`${root}algo/src/mod.js`);
	});
});

describe("the example pack the site serves", () => {
	const PACK = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "packs", "xtyle-pack-example");
	const at = "https://packs.test/example/";

	function servePack(): typeof globalThis.fetch {
		const mod = (id: string) => ({
			[`${at}${id}/mod-manifest.json`]: readFileSync(join(PACK, id, "mod-manifest.json"), "utf8"),
			[`${at}${id}/src/mod.js`]: readFileSync(join(PACK, id, "src", "mod.js"), "utf8"),
		});
		return serve({
			[`${at}package.json`]: readFileSync(join(PACK, "package.json"), "utf8"),
			...mod("example-tinted"),
			...mod("example-banded"),
			[`${at}themes/dusk.json`]: readFileSync(join(PACK, "themes", "dusk.json"), "utf8"),
		});
	}

	it("declares two algorithms and one theme, with nothing malformed", async () => {
		const remote = await fetchPack(at, { fetch: servePack() });
		expect(remote.problems).toEqual([]);
		expect(remote.pack.algorithms.map((entry) => entry.name)).toEqual(["example-tinted", "example-banded"]);
		expect(remote.pack.themes.map((entry) => entry.name)).toEqual(["dusk"]);
	});

	it("loads its algorithm and derives a complete register", async () => {
		const algorithm = await fetchPackAlgorithm(`${at}#example-tinted`, { fetch: servePack() });
		expect(algorithm.id).toBe("example-tinted");
		const register = derive(algorithm, { constraints });
		const baseline = derive(getAlgorithm("xtyle-default"), { constraints });
		expect(Object.keys(register).sort()).toEqual(Object.keys(baseline).sort());
	});

	it("is a distinct posture rather than a copy of the default", async () => {
		const algorithm = await fetchPackAlgorithm(`${at}#example-tinted`, { fetch: servePack() });
		const seed = { constraints: { "--bg-0": "#14131f", "--accent": "#e0a06a" } };
		const tinted = derive(algorithm, seed);
		const baseline = derive(getAlgorithm("xtyle-default"), seed);
		expect(tinted["--accent-bg"]).not.toBe(baseline["--accent-bg"]);
		expect(Object.keys(tinted).filter((token) => tinted[token] !== baseline[token]).length).toBeGreaterThan(50);
	});

	it("declares its knobs without a sandbox boot, so a listing is cheap", async () => {
		const manifest = await fetchPackAlgorithmManifest(`${at}#example-tinted`, { fetch: servePack() });
		expect(manifest?.knobs).toContain("scheme");
		expect(manifest?.invariantCount).toBeGreaterThan(0);
	});

	it("declares its own tokens on top of the standard register, and derives them", async () => {
		const algorithm = await fetchPackAlgorithm(`${at}#example-banded`, { fetch: servePack() });
		const bands = ["--band-quiet", "--band-notice", "--band-alarm", "--band-ink"];
		const baseline = derive(getAlgorithm("xtyle-default"), { constraints });

		expect(algorithm.produces).toEqual(expect.arrayContaining(bands));
		expect(algorithm.produces.length).toBe(baseline ? getAlgorithm("xtyle-default").produces.length + bands.length : 0);

		const register = derive(algorithm, { constraints });
		for (const token of bands) expect(register[token], `${token} must derive`).toMatch(/^#[0-9a-f]{6}$/i);
		for (const token of Object.keys(baseline)) expect(register, "the standard register still arrives whole").toHaveProperty(token);
	});

	it("carries a novel knob that moves what it names", async () => {
		const algorithm = await fetchPackAlgorithm(`${at}#example-banded`, { fetch: servePack() });
		expect(algorithm.knobs).toContain("bandLift");
		const spec = algorithm.knobSpecs?.find((candidate) => candidate.name === "bandLift");
		expect(spec).toMatchObject({ kind: "range", max: 0.18 });

		const tight = derive(algorithm, { constraints, knobs: { bandLift: 0.02 } });
		const wide = derive(algorithm, { constraints, knobs: { bandLift: 0.14 } });
		expect(wide["--band-alarm"]).not.toBe(tight["--band-alarm"]);

		expect(spec?.default, "a range knob with no default seeds a control at 0").toBeTypeOf("number");
		const seeded = derive(algorithm, { constraints, knobs: { bandLift: spec?.default as number } });
		const unset = derive(algorithm, { constraints });
		expect(seeded, "switching the control on must not change what the algorithm derives").toEqual(unset);
		expect(seeded["--band-alarm"], "the seeded ramp must not collapse onto its source").not.toBe(seeded["--danger"]);
	});

	it("answers both algorithms' manifests without booting either", async () => {
		const fetch = servePack();
		const tinted = await fetchPackAlgorithmManifest(`${at}#example-tinted`, { fetch });
		const banded = await fetchPackAlgorithmManifest(`${at}#example-banded`, { fetch });
		expect(banded?.produces.length).toBeGreaterThan(tinted?.produces.length ?? 0);
		expect(banded?.knobs).toContain("bandLift");
		expect(calls(fetch).filter((url) => url.endsWith("mod.js"))).toEqual([]);
	});

	it("carries a theme whose recipe names its own algorithm", async () => {
		const found = await fetchPackTheme(`${at}#dusk`, { fetch: servePack() });
		expect(found.theme.recipe.algorithm).toBe("example-tinted");
		expect(found.theme.meta.name).toBe("Dusk");
	});
});

describe("reading a published theme", () => {
	it("reads the recipe a pack declares", async () => {
		const { root, fetch } = servedAtOwnRoot((at) => ({
			[`${at}package.json`]: pack({ themes: [{ name: "dusk", entry: "themes/dusk.json" }] }),
			[`${at}themes/dusk.json`]: THEME,
		}));
		const found = await fetchPackTheme(root, { fetch });
		expect(found.theme.recipe.algorithm).toBe("xtyle-default");
		expect(found.pack).toBe("@demo/pack");
		expect(found.url).toBe(`${root}themes/dusk.json`);
	});

	it("says so when the file a theme entry names is not a theme file", async () => {
		const { root, fetch } = servedAtOwnRoot((at) => ({
			[`${at}package.json`]: pack({ themes: [{ name: "dusk", entry: "themes/dusk.json" }] }),
			[`${at}themes/dusk.json`]: JSON.stringify({ hello: "world" }),
		}));
		await expect(fetchPackTheme(root, { fetch })).rejects.toThrow(/is not an xtyle theme file/);
	});
});

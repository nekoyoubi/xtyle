import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { compareVersions, existedAt, availableAt, versionsPresent, SINCE_FLOOR } from "../src/provenance.js";
import { listComponents } from "../src/manifest/registry.js";
import { emitterProvenance } from "../src/emit/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..", "..");
const currentVersion = JSON.parse(readFileSync(join(here, "..", "package.json"), "utf8")).version as string;

const ALGORITHMS = ["xtyle-default", "xtyle-hc", "xtyle-quiet", "xtyle-loud", "nxi-nite"];

function packMeta(algo: string): Record<string, unknown> {
	const raw = readFileSync(join(repoRoot, "algorithms", algo, "mod-manifest.json"), "utf8");
	const manifest = JSON.parse(raw);
	return manifest.fills["xtyle.pack-meta"][0];
}

describe("version comparison", () => {
	it("sorts a double-digit minor above a single-digit one", () => {
		expect(compareVersions("0.10.0", "0.9.0")).toBeGreaterThan(0);
		expect(compareVersions("0.9.0", "0.10.0")).toBeLessThan(0);
	});

	it("treats equal versions as equal, however they are written", () => {
		expect(compareVersions("0.10.0", "v0.10.0")).toBe(0);
		expect(compareVersions("1.2", "1.2.0")).toBe(0);
	});

	it("ignores a prerelease suffix rather than choking on it", () => {
		expect(compareVersions("0.10.0-rc.1", "0.10.0")).toBe(0);
	});

	it("orders a real release history correctly", () => {
		const shuffled = ["0.9.0", "0.10.0", "0.1.0", "0.2.0", "0.8.0"];
		expect([...shuffled].sort(compareVersions)).toEqual(["0.1.0", "0.2.0", "0.8.0", "0.9.0", "0.10.0"]);
	});
});

describe("existedAt", () => {
	it("admits something introduced at or before the asked-for version", () => {
		expect(existedAt("0.8.0", "0.9.0")).toBe(true);
		expect(existedAt("0.9.0", "0.9.0")).toBe(true);
	});

	it("refuses something introduced after it", () => {
		expect(existedAt("0.10.0", "0.9.0")).toBe(false);
	});

	it("reads an undated entry as always-present rather than never", () => {
		expect(existedAt(undefined, "0.1.0")).toBe(true);
	});

	it("does not invert across a double-digit minor", () => {
		expect(existedAt("0.9.0", "0.10.0")).toBe(true);
		expect(existedAt("0.10.0", "0.9.0")).toBe(false);
	});
});

describe("availableAt", () => {
	it("splits a set and counts what it held back", () => {
		const items = [{ since: "0.1.0" }, { since: "0.9.0" }, { since: "0.10.0" }];
		const result = availableAt(items, "0.9.0");
		expect(result.available).toHaveLength(2);
		expect(result.omitted).toBe(1);
	});
});

describe("the provenance rule", () => {
	it("dates every component", () => {
		const undated = listComponents().filter((c) => !c.since);
		expect(undated.map((c) => c.id)).toEqual([]);
	});

	it("dates every algorithm pack", () => {
		const undated = ALGORITHMS.filter((a) => !packMeta(a).since);
		expect(undated).toEqual([]);
	});

	it("dates every emit format", () => {
		const undated = emitterProvenance().filter((e) => !e.since);
		expect(undated.map((e) => e.format)).toEqual([]);
	});

	it("never claims a version newer than the one being built", () => {
		const offenders: string[] = [];
		for (const c of listComponents()) {
			if (c.since && compareVersions(c.since, currentVersion) > 0) offenders.push(`component ${c.id}: ${c.since}`);
		}
		for (const algo of ALGORITHMS) {
			const meta = packMeta(algo);
			const since = meta.since as string | undefined;
			if (since && compareVersions(since, currentVersion) > 0) offenders.push(`algorithm ${algo}: ${since}`);
			for (const [token, version] of Object.entries((meta.producedSince ?? {}) as Record<string, string>)) {
				if (compareVersions(version, currentVersion) > 0) offenders.push(`${algo} token ${token}: ${version}`);
			}
		}
		for (const e of emitterProvenance()) {
			if (e.since && compareVersions(e.since, currentVersion) > 0) offenders.push(`emitter ${e.format}: ${e.since}`);
		}
		expect(offenders).toEqual([]);
	});

	it("keeps producedSince sparse — floor entries are absent, not spelled out", () => {
		for (const algo of ALGORITHMS) {
			const produced = (packMeta(algo).producedSince ?? {}) as Record<string, string>;
			const atFloor = Object.entries(produced).filter(([, v]) => v === SINCE_FLOOR);
			expect(atFloor, `${algo} spells out floor entries`).toEqual([]);
		}
	});

	it("only dates tokens the pack still produces", () => {
		for (const algo of ALGORITHMS) {
			const meta = packMeta(algo);
			const produces = new Set(meta.produces as string[]);
			const stale = Object.keys((meta.producedSince ?? {}) as Record<string, string>).filter((t) => !produces.has(t));
			expect(stale, `${algo} dates tokens it no longer produces`).toEqual([]);
		}
	});
});

describe("versionsPresent", () => {
	it("reports the release history of a set, oldest first", () => {
		expect(versionsPresent([{ since: "0.10.0" }, { since: "0.1.0" }, { since: "0.9.0" }, {}])).toEqual([
			"0.1.0",
			"0.9.0",
			"0.10.0",
		]);
	});
});

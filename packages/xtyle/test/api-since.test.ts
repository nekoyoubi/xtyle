import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
// @ts-expect-error a plain .mjs script with no declarations
import { exportsOf } from "../../../scripts/api-exports.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const core = resolve(here, "..");
const table = JSON.parse(readFileSync(resolve(core, "api-since.json"), "utf8")) as {
	floor: string;
	since: Record<string, Record<string, string>>;
};
const version = (JSON.parse(readFileSync(resolve(core, "package.json"), "utf8")) as { version: string }).version;
const live = exportsOf(core, true) as Record<string, string[]>;

const rank = (v: string) => v.split(".").map(Number).reduce((n, part) => n * 1000 + part, 0);

describe("api-since.json says when each export arrived", () => {
	it("names every export each subpath has now, and nothing it no longer has", () => {
		const drift: string[] = [];
		for (const [subpath, names] of Object.entries(live)) {
			const recorded = table.since[subpath] ?? {};
			for (const name of names) if (!(Object.hasOwn(recorded, name))) drift.push(`${subpath}: ${name} is exported and unrecorded`);
			for (const name of Object.keys(recorded)) if (!names.includes(name)) drift.push(`${subpath}: ${name} is recorded and no longer exported`);
		}
		for (const subpath of Object.keys(table.since)) if (!Object.hasOwn(live, subpath)) drift.push(`${subpath} is recorded and is not a subpath`);
		expect(drift, "run `node scripts/build-api-since.mjs` from the repo root").toEqual([]);
	});

	it("dates nothing after the version being built, or before the first one published", () => {
		const out = Object.entries(table.since).flatMap(([subpath, names]) =>
			Object.entries(names)
				.filter(([, since]) => !/^\d+\.\d+\.\d+$/.test(since) || rank(since) > rank(version) || rank(since) < rank(table.floor))
				.map(([name, since]) => `${subpath}#${name}: ${since}`),
		);
		expect(out).toEqual([]);
	});

	it("reads a real surface rather than an empty one", () => {
		expect(live["."]?.length ?? 0).toBeGreaterThan(300);
		expect(table.since["."]?.["derive"]).toBe(table.floor);
		expect(table.since["./install"]?.["install"]).toBe("0.13.0");
	});
});

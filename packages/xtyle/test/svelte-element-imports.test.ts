import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Every Svelte wrapper pulls its custom element in by a per-element subpath
// (`@xtyle/core/elements/<id>.js`) rather than the whole-barrel `register.js`. That is what keeps a
// consumer who renders one component from shipping all 87 elements — and, transitively, the ~300
// Prism grammar chunks the code element's language table dynamic-imports. These tests guard the
// seam: the subpath a wrapper imports must resolve to a real element module, and that module must
// actually `define()` the tag the wrapper renders. Get either half wrong and the component silently
// never upgrades in the browser, which no type check or render test would catch.

const here = dirname(fileURLToPath(import.meta.url));
const elementsDir = resolve(here, "../src/elements");
const svelteDir = resolve(here, "../../svelte/src");

const elementSources = readdirSync(elementsDir).filter((f) => f.endsWith(".ts") && !f.endsWith(".d.ts"));

/** tag (`xtyle-card`) -> element module id (`card`), read off the `define()` calls themselves. */
const tagToModule = new Map<string, string>();
for (const file of elementSources) {
	const source = readFileSync(resolve(elementsDir, file), "utf8");
	for (const match of source.matchAll(/define\(\s*"(xtyle-[a-z-]+)"/g)) {
		tagToModule.set(match[1], file.slice(0, -3));
	}
}

const wrappers = readdirSync(svelteDir).filter((f) => f.endsWith(".svelte"));

const importedModule = (source: string): string | undefined =>
	source.match(/import\s+"@xtyle\/core\/elements\/([a-z-]+)\.js"/)?.[1];

/** The element tag a wrapper renders, taken from its markup (not its comments). */
const renderedTag = (source: string): string | undefined =>
	source.match(/^\s*<(xtyle-[a-z-]+)/m)?.[1];

describe("svelte wrappers import their element by subpath", () => {
	it("no wrapper reaches for the whole-barrel register", () => {
		const offenders = wrappers.filter((f) => readFileSync(resolve(svelteDir, f), "utf8").includes('"./register.js"'));
		expect(offenders).toEqual([]);
	});

	it("every wrapper that renders an element imports a module that defines that element's tag", () => {
		const broken: string[] = [];
		for (const file of wrappers) {
			const source = readFileSync(resolve(svelteDir, file), "utf8");
			const tag = renderedTag(source);
			if (!tag) continue;
			const mod = importedModule(source);
			if (!mod) {
				broken.push(`${file} renders <${tag}> but imports no element module`);
				continue;
			}
			if (tagToModule.get(tag) !== mod) {
				broken.push(`${file} renders <${tag}> (defined in ${tagToModule.get(tag)}.ts) but imports ${mod}.js`);
			}
		}
		expect(broken).toEqual([]);
	});

	it("every imported element subpath resolves to a real element module", () => {
		const missing: string[] = [];
		for (const file of wrappers) {
			const source = readFileSync(resolve(svelteDir, file), "utf8");
			for (const match of source.matchAll(/import\s+"@xtyle\/core\/elements\/([a-z-]+)\.js"/g)) {
				if (!elementSources.includes(`${match[1]}.ts`)) missing.push(`${file} -> ${match[1]}.js`);
			}
		}
		expect(missing).toEqual([]);
	});
});

describe("elements that build other elements pull them in", () => {
	// An element that hand-builds another element with `createElement("xtyle-…")` used to get away with
	// it: the barrel had already defined every tag. Under per-element imports nothing else guarantees
	// the tag is defined, so the dependency has to be a real import — from the element module itself,
	// or from every wrapper that mounts it.
	it("each createElement'd tag is imported by the module that builds it, or by its wrapper", () => {
		const unmet: string[] = [];
		for (const file of elementSources) {
			const id = file.slice(0, -3);
			const source = readFileSync(resolve(elementsDir, file), "utf8");
			for (const match of source.matchAll(/createElement\(\s*"(xtyle-[a-z-]+)"/g)) {
				const tag = match[1];
				const dep = tagToModule.get(tag);
				if (!dep || dep === id) continue;
				if (new RegExp(`import\\s+"\\./${dep}\\.js"`).test(source)) continue;

				const wrappersMountingIt = wrappers.filter((w) => importedModule(readFileSync(resolve(svelteDir, w), "utf8")) === id);
				const covered =
					wrappersMountingIt.length > 0 &&
					wrappersMountingIt.every((w) =>
						new RegExp(`import\\s+"@xtyle/core/elements/${dep}\\.js"`).test(readFileSync(resolve(svelteDir, w), "utf8")),
					);
				if (!covered) unmet.push(`${file} builds <${tag}> but neither it nor its wrapper imports ${dep}.js`);
			}
		}
		expect(unmet).toEqual([]);
	});
});

describe("package manifests keep the tree-shaking contract", () => {
	const corePkg = JSON.parse(readFileSync(resolve(here, "../package.json"), "utf8"));
	const sveltePkg = JSON.parse(readFileSync(resolve(here, "../../svelte/package.json"), "utf8"));

	it("core exposes per-element subpaths without dropping its explicit element entries", () => {
		expect(corePkg.exports["./elements/*"]).toBe("./dist/elements/*");
		expect(corePkg.exports["./elements"]).toBe("./dist/elements/index.js");
		expect(corePkg.exports["./elements/ssr"]).toBe("./dist/elements/fragment-ssr.js");
		expect(corePkg.exports["./elements/code-highlight"]).toBe("./dist/elements/code-highlight.js");
	});

	it("core is not marked side-effect-free, since its element modules define() on import", () => {
		expect(corePkg.sideEffects).toBeUndefined();
	});

	it("svelte is tree-shakeable but keeps the register escape hatch side-effectful", () => {
		// A bare `sideEffects: false` here would let a bundler drop `import "@xtyle/svelte/register"`
		// outright — it uses no exports — and the opt-in would silently register nothing.
		expect(sveltePkg.sideEffects).toEqual(["./dist/register.js"]);
		expect(sveltePkg.exports["./register"]).toBeDefined();
	});
});

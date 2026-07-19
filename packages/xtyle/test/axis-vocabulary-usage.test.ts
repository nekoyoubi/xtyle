import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const REPO = join(import.meta.dirname, "..", "..", "..");
const SRC = join(import.meta.dirname, "..", "src");

/**
 * The sibling of `tone-vocabulary-usage`, for every *other* axis that lands in a class name. A wrong
 * `size` or `variant` fails the same silent way a wrong tone does: `xtyle-badge--small` matches no
 * rule, so the component renders with no chrome and still looks deliberate. This scan found sixteen
 * live offenders on first run — every one a tone (`neutral`, `danger`, `accent`) authored as a
 * `variant`, so those buttons had been rendering with no variant treatment at all.
 */

const VOCAB = new Map<string, readonly string[]>();
for (const m of readFileSync(join(SRC, "vocab.ts"), "utf8").matchAll(
	/^export const ([A-Z_0-9]+) = \[([^\]]*)\] as const;$/gm,
)) {
	VOCAB.set(m[1], [...m[2].matchAll(/"([^"]*)"/g)].map((x) => x[1]));
}

/** The palette roster lives in `series.ts` rather than `vocab.ts`, but it is a closed set all the same. */
const PALETTES = [
	...readFileSync(join(SRC, "series.ts"), "utf8")
		.match(/^export const PALETTES: readonly Palette\[\] = \[([^\]]*)\];$/m)![1]
		.matchAll(/"([^"]*)"/g),
].map((m) => m[1]);

/** component id -> attribute -> the set its accessor actually resolves against. */
function validatedAxes(): Map<string, Map<string, readonly string[]>> {
	const axes = new Map<string, Map<string, readonly string[]>>();
	const dir = join(SRC, "elements");
	const register = (component: string, attr: string, allowed: readonly string[]) => {
		if (!axes.has(component)) axes.set(component, new Map());
		axes.get(component)!.set(attr, allowed);
	};
	for (const file of readdirSync(dir).filter((f) => f.endsWith(".ts"))) {
		const component = file.replace(/\.ts$/, "");
		const src = readFileSync(join(dir, file), "utf8");
		for (const m of src.matchAll(
			/resolve(?:Optional)?Vocab(?:<[^>]*>)?\(\s*this\.getAttribute\("([^"]+)"\),\s*([A-Z_0-9]+),/g,
		)) {
			const allowed = VOCAB.get(m[2]);
			if (allowed) register(component, m[1], allowed);
		}
		for (const m of src.matchAll(/resolvePaletteName\(\s*this\.getAttribute\("([^"]+)"\),/g)) {
			register(component, m[1], PALETTES);
		}
		// bar/chart/pie read `scheme` through an accessor that also accepts a JSON color array, so the
		// call site names the local rather than the attribute
		if (/resolvePaletteName\(scheme,/.test(src)) register(component, "scheme", PALETTES);
	}
	return axes;
}

const SOURCE = /\.(astro|svelte|ts|html)$/;
const SKIP = /node_modules|[\\/]dist[\\/]|[\\/]\.astro[\\/]|__baselines__|source\.generated/;

/** `<SplitButton` and `<xtyle-split-button` both name the `split-button` element. */
function componentId(tag: string): string {
	if (tag.startsWith("xtyle-")) return tag.slice("xtyle-".length);
	return tag.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function offenders(dir: string, axes: Map<string, Map<string, readonly string[]>>) {
	const found: { file: string; component: string; attr: string; value: string }[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (SKIP.test(path)) continue;
		if (entry.isDirectory()) {
			found.push(...offenders(path, axes));
			continue;
		}
		if (!SOURCE.test(entry.name)) continue;
		const text = readFileSync(path, "utf8");
		for (const tag of text.matchAll(/<(xtyle-[a-z-]+|[A-Z][A-Za-z0-9]*)((?:\s[^<>]*)?)\/?>/g)) {
			const forComponent = axes.get(componentId(tag[1]));
			if (!forComponent) continue;
			for (const attr of tag[2].matchAll(/\s([a-z-]+)="([^"{}]*)"/g)) {
				const allowed = forComponent.get(attr[1]);
				if (!allowed || allowed.includes(attr[2])) continue;
				// `scheme` is genuinely open: a palette name *or* a JSON array of colors
				if (attr[2].startsWith("[")) continue;
				found.push({
					file: path.slice(REPO.length + 1),
					component: componentId(tag[1]),
					attr: attr[1],
					value: attr[2],
				});
			}
		}
	}
	return found;
}

describe("axis vocabulary usage", () => {
	const axes = validatedAxes();

	it("validates every axis it claims to cover", () => {
		// guards the scan itself: if the accessors stop matching, the sweep below silently passes
		expect(axes.size).toBeGreaterThan(40);
		expect(axes.get("badge")?.get("size")).toContain("md");
		expect(axes.get("button")?.get("variant")).toContain("link");
	});

	it("never authors a value outside its axis vocabulary", () => {
		expect(offenders(join(REPO, "apps", "site", "src"), axes).concat(offenders(join(REPO, "packages"), axes))).toEqual(
			[],
		);
	});
});

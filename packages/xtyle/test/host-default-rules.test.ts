import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, "..", "src");

/**
 * A host layout rule keyed on an attribute value that is *also* that prop's default is a rule that
 * never matches the case it describes. The default is resolved in JS and not written to the element,
 * so an author who omits the attribute — exactly what a manifest listing a default invites — gets the
 * unqualified base rule instead. It fails silently and only in some containers: the element keeps a
 * correct a11y tree and collapses to zero size wherever nothing stretches it.
 *
 * Reflecting the default would make the selector true, but layout would then depend on the runtime
 * having run, which the zero-JS static render path does not guarantee. So the rule must key the
 * exception and let the default be the unqualified base, which is correct with no JS at all.
 */
function hostDisplayBlock(): string {
	const file = readFileSync(join(src, "css", "components.ts"), "utf8");
	const start = file.indexOf("const hostDisplayCss");
	expect(start, "hostDisplayCss not found in css/components.ts").toBeGreaterThan(-1);
	return file.slice(start, file.indexOf("];", start));
}

function defaultFor(tag: string, attr: string): string | null {
	const file = join(src, "elements", `${tag.replace("xtyle-", "")}.ts`);
	if (!existsSync(file)) return null;
	const source = readFileSync(file, "utf8");
	const pattern = new RegExp(
		String.raw`getAttribute\(\s*"${attr}"\s*\)\s*,\s*[A-Z_][A-Za-z_]*\s*,\s*"([^"]+)"`,
	);
	return source.match(pattern)?.[1] ?? null;
}

describe("a host layout rule never keys on the value it is the default for", () => {
	const rules = [...hostDisplayBlock().matchAll(/(xtyle-[a-z-]+)\[([a-z-]+)="([^"]+)"\]/g)];

	it("finds attribute-keyed host rules to check, so a rewrite cannot silently empty this", () => {
		expect(rules.length).toBeGreaterThan(3);
	});

	it.each(rules.map((r) => [r[1] as string, r[2] as string, r[3] as string]))(
		"%s[%s=%s] keys the exception rather than the default",
		(tag, attr, value) => {
			const fallback = defaultFor(tag, attr);
			if (fallback === null) return;
			expect(
				value,
				`${tag}[${attr}="${value}"] keys ${attr}'s own default, so it cannot match an element that omits the attribute`,
			).not.toBe(fallback);
		},
	);
});

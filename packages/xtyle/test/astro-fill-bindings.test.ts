import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A fill gates structural markup on a `has*` binding, and each binding surface has to supply it. The
 * Astro wrapper is the one that gets missed: it builds its own bindings object for `renderFragmentLight`
 * rather than reading the element's, so a fill that starts gating on a new `has*` renders that markup
 * everywhere except a static Astro page. It fails silently and in one direction only — the slot the
 * wrapper then tries to fill is not in the emitted chrome, so the author's content is dropped with no
 * error. `hasFooter` shipped that way.
 */
const astroDir = join(import.meta.dirname, "..", "..", "astro", "src");
const fragmentsDir = join(import.meta.dirname, "..", "src", "elements", "fragments");

const RENDER_CALL = /renderFragmentLight\(\s*"([a-z0-9-]+)"/g;
const GATE_READ = /\b(?:b|bindings)\.(has[A-Z][A-Za-z0-9]*)/g;

function gatesReadBy(fragment: string): string[] {
	const mod = join(fragmentsDir, fragment, "mod.ts");
	if (!existsSync(mod)) return [];
	const source = readFileSync(mod, "utf8");
	return [...new Set(Array.from(source.matchAll(GATE_READ), (m) => m[1] as string))];
}

const wrappers = readdirSync(astroDir)
	.filter((f) => f.endsWith(".astro"))
	.map((file) => {
		const source = readFileSync(join(astroDir, file), "utf8");
		const fragments = [...new Set(Array.from(source.matchAll(RENDER_CALL), (m) => m[1] as string))];
		return { file, source, fragments };
	})
	.filter((w) => w.fragments.length > 0);

describe("astro wrappers supply every structural gate their fill reads", () => {
	it("finds the wrappers to check", () => {
		expect(wrappers.length).toBeGreaterThan(0);
	});

	for (const { file, source, fragments } of wrappers) {
		for (const fragment of fragments) {
			const gates = gatesReadBy(fragment);
			if (gates.length === 0) continue;
			it(`${file} supplies ${fragment}'s ${gates.join(", ")}`, () => {
				for (const gate of gates) {
					expect(
						source.includes(gate),
						`${file} renders the "${fragment}" fill, which gates markup on \`${gate}\`, but never supplies it — that markup is dropped in the static Astro render`,
					).toBe(true);
				}
			});
		}
	}
});

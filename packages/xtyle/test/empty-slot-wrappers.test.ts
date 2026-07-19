import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * `:empty` cannot see a slot's content, and reaching for it anyway is the most repeated defect in
 * this library.
 *
 * An element that holds a `<slot>` has a child node, so `:empty` never matches it. The nodes the
 * consumer assigns to that slot are *not* children of the slot — projection is not parenthood — so
 * no selector distinguishes a filled region from an unfilled one: not `:empty`, not `:has(*)`, not
 * `:has(slot:not(:has(*)))`. The information simply is not in the tree.
 *
 * It looks like it works, which is why it keeps landing. Under the Astro SSR render the composition
 * resolves each `<slot>` away, so the wrapper really is empty and the rule really does fire — and
 * that is the one configuration this repo looks at all day. Every client-created element (`mode`
 * auto with no SSR scaffold, or `isolated`) keeps the real `<slot>`, and the rule silently stops
 * working: `field` reserved 24px of dead padding on both sides of every input, `sheet` painted a
 * 905x33 footer bar on every sheet that had none, and `alert` stacked its icon on every
 * message-only alert because `:has(.xtyle-alert__title:not(:empty))` was unconditionally true.
 *
 * The fix is always the same, and it is not a selector: only the host knows, so the host says. It
 * reads `fragment.hasSlotted(name)` — which checks captured regions in light DOM and the host's own
 * children in shadow DOM — passes the answer as a binding, and the fill stamps `hidden`. Under SSR
 * the binding comes from `Astro.slots.has(name)`. The region carries `data-slot` so the light-DOM
 * host can capture it at all.
 *
 * So: a `:empty` rule may not target a region that holds a slot. Nothing about layout is asserted
 * here — the defect is visible in the source, and a DOM-less check catches it before it ships.
 */
const SRC = join(import.meta.dirname, "..", "src");
const FRAGMENTS = join(SRC, "elements", "fragments");
const CSS = join(SRC, "css", "components");

/** Every class whose element wraps a `<slot>` in some fill's markup, mapped to the fragment(s). */
function slotWrappingClasses(): Map<string, string[]> {
	const found = new Map<string, string[]>();
	for (const id of readdirSync(FRAGMENTS)) {
		const dir = join(FRAGMENTS, id);
		const sources = [join(dir, "mod.ts"), join(dir, `${id}.html`)].filter((p) => existsSync(p));
		for (const path of sources) {
			const text = readFileSync(path, "utf8");
			// an element that opens, carries a class, and contains a <slot> before it closes
			for (const m of text.matchAll(/<(\w+)[^>]*\bclass=["'`]([^"'`]+)["'`][^>]*>\s*<slot\b/g)) {
				for (const cls of m[2].split(/\s+/).filter((c) => c.startsWith("xtyle-"))) {
					const seen = found.get(cls) ?? [];
					if (!seen.includes(id)) seen.push(id);
					found.set(cls, seen);
				}
			}
		}
	}
	return found;
}

/** Every class a `:empty` selector targets, mapped to the stylesheet it came from. */
function emptyGatedClasses(): Map<string, string[]> {
	const found = new Map<string, string[]>();
	for (const file of readdirSync(CSS).filter((f) => f.endsWith(".ts"))) {
		const text = readFileSync(join(CSS, file), "utf8")
			// comments discuss `:empty` freely; only real selectors count
			.replace(/\/\*[\s\S]*?\*\//g, "");
		for (const m of text.matchAll(/\.(xtyle-[\w-]+):empty/g)) {
			const seen = found.get(m[1]) ?? [];
			if (!seen.includes(file)) seen.push(file);
			found.set(m[1], seen);
		}
	}
	return found;
}

describe(":empty never gates a region that holds a slot", () => {
	const wrappers = slotWrappingClasses();
	const gated = emptyGatedClasses();

	it("finds the fills and the stylesheets, so a bad path can't pass vacuously", () => {
		expect(wrappers.size, "no slot-wrapping regions found — did the fill layout change?").toBeGreaterThan(5);
		expect(readdirSync(CSS).length).toBeGreaterThan(20);
	});

	it("no stylesheet gates a slot-wrapping region on :empty", () => {
		const offenders = [...gated.entries()]
			.filter(([cls]) => wrappers.has(cls))
			.map(([cls, files]) => `.${cls}:empty (${files.join(", ")}) — wraps a slot in ${wrappers.get(cls)?.join(", ")}`);
		expect(
			offenders,
			"A region holding a <slot> is never :empty — the slot is a child, its assigned nodes are not.\n" +
				"The rule works only under the SSR render, which resolves the slot away, and silently fails for\n" +
				"every client-created element. Pass the host's `hasSlotted(name)` through as a binding and stamp\n" +
				"`hidden` in the fill instead:\n  " +
				offenders.join("\n  "),
		).toEqual([]);
	});

	it("no stylesheet gates a slot-wrapping region on :has(…:empty) either", () => {
		const offenders: string[] = [];
		for (const file of readdirSync(CSS).filter((f) => f.endsWith(".ts"))) {
			const text = readFileSync(join(CSS, file), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
			for (const m of text.matchAll(/:has\(\s*\.(xtyle-[\w-]+):(?:not\()?:?empty/g)) {
				if (wrappers.has(m[1])) offenders.push(`.${m[1]} in ${file}`);
			}
		}
		expect(
			offenders,
			"`:has(.region:not(:empty))` is unconditionally true for a slot-wrapping region, so the branch it\n" +
				"guards is always taken. Gate it on the fill's `hidden` instead:\n  " + offenders.join("\n  "),
		).toEqual([]);
	});
});

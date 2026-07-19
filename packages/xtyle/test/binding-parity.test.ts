import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { listComponents } from "../src/manifest/index.js";

// Each component manifest declares which bindings it supports; a declared `svelte`/`astro`
// binding must have a matching wrapper file in the sibling package, or the binding is a
// promise the package doesn't keep. The SSR registry test guards the core↔astro seam at
// render time; this guards the manifest↔wrapper seam at the file level. Both sides are
// compared by their letters-and-digits only (lowercased, separators dropped), so the id's
// hyphens and the wrapper's PascalCase line up without assuming a specific casing scheme.
const key = (name: string): string => name.toLowerCase().replace(/[^a-z0-9]/g, "");

const here = dirname(fileURLToPath(import.meta.url));
const wrapperKeys = (pkg: string, ext: string): Set<string> => {
	const dir = resolve(here, "../..", pkg, "src");
	return new Set(readdirSync(dir).filter((f) => f.endsWith(ext)).map((f) => key(f.slice(0, -ext.length))));
};

const svelteWrappers = wrapperKeys("svelte", ".svelte");
const astroWrappers = wrapperKeys("astro", ".astro");

describe("binding parity", () => {
	const components = listComponents();

	it("every component declaring a svelte binding ships a Svelte wrapper", () => {
		const missing = components
			.filter((c) => c.bindings.includes("svelte"))
			.filter((c) => !svelteWrappers.has(key(c.id)));
		expect(missing.map((c) => c.id)).toEqual([]);
	});

	it("every component declaring an astro binding ships an Astro wrapper", () => {
		const missing = components
			.filter((c) => c.bindings.includes("astro"))
			.filter((c) => !astroWrappers.has(key(c.id)));
		expect(missing.map((c) => c.id)).toEqual([]);
	});

	// A wrapper file that exists but isn't re-exported from the barrel is unreachable through the
	// package's public surface (`import { X } from "@xtyle/svelte"` fails to type-check). This is how
	// the chart wrappers shipped invisible: the files were present but never added to `index.ts`.
	it("every Svelte wrapper file is re-exported from the @xtyle/svelte barrel", () => {
		const svelteSrc = resolve(here, "../..", "svelte", "src");
		const files = readdirSync(svelteSrc).filter((f) => f.endsWith(".svelte"));
		const barrel = readFileSync(resolve(svelteSrc, "index.ts"), "utf8");
		const unexported = files.filter((f) => !barrel.includes(`from "./${f}"`));
		expect(unexported).toEqual([]);
	});

	// A Svelte prop that is destructured out of `$props()` is thereby excluded from `...rest`, so unless
	// the wrapper forwards it by hand it reaches the element nowhere: typed, defaulted, documented, and
	// inert. Nothing in the type system catches it, because the prop is perfectly well-declared — it is
	// only the *use* that is missing. This is how `Progress` shipped `ramp` / `ramp-mode` / `reverse` as
	// dead props. A prop the wrapper never destructures is fine: it rides the spread to the element.
	it("every Svelte prop destructured from $props() reaches the element", () => {
		const svelteSrc = resolve(here, "../..", "svelte", "src");
		const dropped: string[] = [];
		for (const file of readdirSync(svelteSrc).filter((f) => f.endsWith(".svelte"))) {
			const src = readFileSync(resolve(svelteSrc, file), "utf8");
			const destructure = src.match(/let\s*\{([\s\S]*?)\}\s*(?::\s*\w+)?\s*=\s*\$props\(\)/);
			if (!destructure) continue;

			const names: string[] = [];
			for (const line of destructure[1].split("\n")) {
				const t = line.trim();
				if (!t || t.startsWith("//") || t.startsWith("*") || t.startsWith("/*") || t.startsWith("...")) continue;
				const renamed = t.match(/^[A-Za-z_$][\w$]*\s*:\s*([A-Za-z_$][\w$]*)/);
				const plain = t.match(/^([A-Za-z_$][\w$]*)\s*(?:[=,]|$)/);
				if (renamed) names.push(renamed[1]);
				else if (plain) names.push(plain[1]);
			}

			// Everything but the declaration itself: the `Props` interface and its doc comments describe
			// the prop, they don't consume it, so a name that appears only there is still dropped.
			let body = src.slice(0, destructure.index) + src.slice(destructure.index! + destructure[0].length);
			const iface = body.match(/interface\s+Props\b/);
			if (iface) {
				const open = body.indexOf("{", iface.index);
				let depth = 0;
				for (let i = open; i < body.length && open >= 0; i++) {
					if (body[i] === "{") depth++;
					else if (body[i] === "}" && --depth === 0) {
						body = body.slice(0, iface.index) + body.slice(i + 1);
						break;
					}
				}
			}
			body = body.replace(/\/\*\*[\s\S]*?\*\//g, "");

			for (const n of names) {
				if (!new RegExp(`\\b${n}\\b`).test(body)) dropped.push(`${file}: ${n}`);
			}
		}
		expect(dropped).toEqual([]);
	});

	// A manifest can document a named slot the binding never wires up, which makes it unreachable: the
	// element renders `<slot name="value">`, the manifest promises it, and the wrapper offers no way to
	// fill it. Astro wrappers are exempt — they project through `Astro.slots`, where the consumer writes
	// `slot="<name>"` on their own markup and no wrapper-side literal exists to look for.
	//
	// A few slots are filled by a companion wrapper the consumer composes in rather than by the parent
	// itself, so the literal lives in the companion's file. Each is listed with the file that fills it.
	const companionFilled: Record<string, string> = { "segmented:segment": "Segment.svelte" };

	it("every named slot a Svelte binding declares is reachable from the wrapper", () => {
		const svelteSrc = resolve(here, "../..", "svelte", "src");
		const byKey = new Map(
			readdirSync(svelteSrc)
				.filter((f) => f.endsWith(".svelte"))
				.map((f) => [key(f.slice(0, -".svelte".length)), f]),
		);
		const fills = (file: string, slot: string): boolean => {
			const src = readFileSync(resolve(svelteSrc, file), "utf8");
			return src.includes(`slot: "${slot}"`) || src.includes(`slot="${slot}"`);
		};
		const unreachable: string[] = [];
		for (const c of components) {
			const named = (c.slots ?? []).filter((s) => s.name !== "default" && s.bindings.includes("svelte"));
			const file = byKey.get(key(c.id));
			if (!named.length || !file) continue;
			for (const slot of named) {
				const companion = companionFilled[`${c.id}:${slot.name}`];
				if (fills(file, slot.name) || (companion && fills(companion, slot.name))) continue;
				unreachable.push(`${file}: ${slot.name}`);
			}
		}
		expect(unreachable).toEqual([]);
	});

	// The reference page's "Code" section renders each example's per-binding source. A component that
	// declares a binding but ships no example source for it leaves that tab empty, so the sample the
	// binding promises never appears (dock-zone shipped html-only despite declaring svelte + astro).
	it("every component's examples cover each declared binding", () => {
		const gaps = components
			.map((c) => {
				const langs = new Set<string>();
				for (const ex of c.examples ?? []) for (const lang of Object.keys(ex.source ?? {})) langs.add(lang);
				const missing = c.bindings.filter((b) => !langs.has(b));
				return missing.length ? `${c.id}: missing ${missing.join(", ")}` : null;
			})
			.filter(Boolean);
		expect(gaps).toEqual([]);
	});
});

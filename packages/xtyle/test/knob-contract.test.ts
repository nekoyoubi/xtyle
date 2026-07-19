import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { derive, migratedTarget, resolveKnobSpecs, schemeOf, validateKnobs } from "../src/index.js";
import { SHARED_KNOB_SPECS } from "../src/algorithms/factory.js";
import { algorithmDomains, bakedAlgorithm } from "../src/baked.js";
import { availableAlgorithms, resolveInstalledAlgorithm, HARNESS_TIMEOUT_MS } from "../src/host/registry.js";
import { formatInput } from "../src/mcp/tools.js";

const here = dirname(fileURLToPath(import.meta.url));

/**
 * The blessed set, pinned. These tests grade *first-party* invariants — that the shared knobs are live
 * on every algorithm we ship, that none of them leaks another's knob — so the matrix is the algorithms
 * we are responsible for, not whatever happens to be installed. The registry discovers algorithms now,
 * and a stranger's pack showing up in this matrix would fail it for behavior we never promised.
 */
const BLESSED = ["xtyle-default", "xtyle-hc", "xtyle-quiet", "xtyle-loud", "nxi-nite"] as const;

/**
 * The knob tier is a contract between three parties that never meet: an algorithm declares a knob's
 * domain, a consumer renders a control from that declaration, and the derivation reads the value. Each
 * test here pins a seam where those three can drift apart — a knob the derivation reads but no
 * algorithm declares, a domain the engine holds on one algorithm's behalf, a control that opens on a
 * value the derivation would never have produced.
 */
describe("the knob contract", () => {
	describe("a retired algorithm migrates rather than dying", () => {
		it("resolves `xtyle-brand` onto the knob that reproduces it", () => {
			expect(migratedTarget("xtyle-brand")).toEqual({
				algorithm: "xtyle-default",
				knobs: { accentStrategy: "shade" },
			});
		});

		it("derives `xtyle-brand` byte-identically to the knob it retired into", async () => {
			const brand = migratedTarget("xtyle-brand");
			const viaRetiredId = derive(await bakedAlgorithm(brand.algorithm), { knobs: brand.knobs });
			const viaKnob = derive(await bakedAlgorithm("xtyle-default"), { knobs: { accentStrategy: "shade" } });
			expect(viaRetiredId).toEqual(viaKnob);
		});

		it("lets a caller's own knob win over the migration's", () => {
			// A theme that names the retired id *and* sets the strategy meant the strategy it set.
			expect(migratedTarget("xtyle-brand", { accentStrategy: "duo" }).knobs).toEqual({ accentStrategy: "duo" });
		});

		it("leaves a live algorithm untouched", () => {
			expect(migratedTarget("xtyle-default", { vibrancy: 0.7 })).toEqual({
				algorithm: "xtyle-default",
				knobs: { vibrancy: 0.7 },
			});
		});
	});

	describe("an algorithm owns the domain of the knobs only it reads", () => {
		it("ships every blessed algorithm, whatever else the registry discovers", () => {
			// The matrix below is pinned to the blessed set; this is what keeps the pin honest — an
			// algorithm quietly dropped from `algorithms/` would otherwise leave its row silently untested.
			expect(availableAlgorithms()).toEqual(expect.arrayContaining([...BLESSED]));
		});

		it("keeps `hour` out of the engine's shared registry", () => {
			// `hour` is nxi-nite's alone. A shared registry holding it is the hardcoded name-keyed table
			// `knobSpecs` exists to delete, moved one layer down.
			expect(SHARED_KNOB_SPECS.map((s) => s.name)).not.toContain("hour");
		});

		it("resolves `hour` from nxi-nite's own declaration, and nowhere else", async () => {
			const nite = await bakedAlgorithm("nxi-nite");
			expect(nite.knobSpecs.find((s) => s.name === "hour")).toMatchObject({ kind: "range", min: 0, max: 24 });

			for (const id of BLESSED.filter((a) => a !== "nxi-nite")) {
				const algorithm = await bakedAlgorithm(id);
				expect(algorithm.knobSpecs.map((s) => s.name), `${id} should not carry nxi-nite's knob`).not.toContain("hour");
			}
		});
	});

	describe("every knob the derivation reads is a knob some algorithm declares", () => {
		// A rail that renders only from the declaration silently drops a knob the derivation still honors,
		// while a saved recipe that sets it keeps working — declaration and behavior can point opposite ways.
		it.each(["accentStrategy", "surfaceRamp"])("declares `%s` on every algorithm whose derivation honors it", async (knob) => {
			for (const id of BLESSED) {
				const algorithm = await bakedAlgorithm(id);
				expect(algorithm.knobs, `${id} reads ${knob} but never declares it`).toContain(knob);
				expect(algorithm.knobSpecs.map((s) => s.name), `${id} declares ${knob} with no domain`).toContain(knob);
			}
		});

		it("proves the knob is live on every algorithm by deriving a different theme with it", async () => {
			for (const id of BLESSED) {
				const algorithm = await bakedAlgorithm(id);
				const base = derive(algorithm, {});
				const shaded = derive(algorithm, { knobs: { accentStrategy: "shade" } });
				const ramped = derive(algorithm, { knobs: { surfaceRamp: -0.06 } });
				expect(shaded["--accent-2"], `accentStrategy is inert on ${id}`).not.toBe(base["--accent-2"]);
				expect(ramped["--bg-2"], `surfaceRamp is inert on ${id}`).not.toBe(base["--bg-2"]);
			}
		});
	});

	describe("a control opens on the value the derivation is already using", () => {
		const surfaceRamp = SHARED_KNOB_SPECS.find((s) => s.name === "surfaceRamp");

		it("declares a signed default per scheme, because one static number is wrong for half of all themes", () => {
			expect(surfaceRamp?.defaultByScheme).toEqual({ dark: 0.045, light: -0.045 });
		});

		// The bug this pins: the rail seeded `surfaceRamp` from the lone `default` (+0.045). Under a light
		// scheme the derivation resolves to *-0.045*, so merely switching the control from "default" to
		// "custom" flipped the sign and inverted the whole surface stack without the author touching it.
		it.each(["dark", "light"] as const)("seeds %s with the ramp that scheme actually derives", async (scheme) => {
			const algorithm = await bakedAlgorithm("xtyle-default");
			const seed = surfaceRamp?.defaultByScheme?.[scheme] ?? surfaceRamp?.default;

			const untouched = derive(algorithm, { knobs: { scheme } });
			const seeded = derive(algorithm, { knobs: { scheme, surfaceRamp: seed as number } });

			expect(seeded).toEqual(untouched);
		});

		it("walks the surface stack in the direction the scheme implies", async () => {
			const algorithm = await bakedAlgorithm("xtyle-default");
			for (const scheme of ["dark", "light"] as const) {
				const register = derive(algorithm, { knobs: { scheme } });
				// A dark scheme ascends (each surface lighter than the last); a light scheme descends.
				expect(schemeOf(register["--bg-0"])).toBe(scheme);
				const climbs = scheme === "dark";
				const [bg0, bg1, bg2] = [register["--bg-0"], register["--bg-1"], register["--bg-2"]];
				expect(lightnessOrder(bg0, bg1, bg2), `${scheme} stack runs the wrong way`).toBe(climbs ? "ascending" : "descending");
			}
		});
	});

	describe("a novel knob degrades to a control rather than vanishing", () => {
		it("gives an undeclared knob a text field instead of dropping it silently", () => {
			// An algorithm that names a knob it never described still *reads* it. Dropping it leaves the one
			// thing the author asked for unreachable, with nothing on screen to say why.
			expect(resolveKnobSpecs(["mood"])).toEqual([{ name: "mood", kind: "text", undeclared: true }]);
		});

		it("honors an algorithm's own spec for a knob the engine has never heard of", () => {
			const spec = { name: "mood", kind: "select" as const, options: [{ value: "wistful" }] };
			expect(resolveKnobSpecs(["mood"], [spec])).toEqual([spec]);
		});

		it("marks a synthesized spec as undeclared, so a discovery surface can name the gap", () => {
			expect(resolveKnobSpecs(["mood"])[0]?.undeclared).toBe(true);
			expect(resolveKnobSpecs(["vibrancy"])[0]?.undeclared).toBeUndefined();
		});

		it("lets a group declare that it is composite, rather than the engine keeping a list of which names are", () => {
			// `anchors` and `fonts` are clusters a consumer expands itself, not single scalar controls. They
			// say so in their own spec: an engine-side set of composite *names* would be the same hardcoded
			// name-keyed table `knobSpecs` exists to delete, and it would leave a third-party algorithm's own
			// composite knob with no way to say what it is — under the text fallback it would render as a
			// scalar text field, which is worse than the old silent drop.
			expect(resolveKnobSpecs(["anchors", "fonts"]).map((s) => s.kind)).toEqual(["composite", "composite"]);
			const mine = { name: "palette", kind: "composite" as const };
			expect(resolveKnobSpecs(["palette"], [mine])).toEqual([mine]);
		});
	});

	describe("a knob is checked against the domain its algorithm declares", () => {
		// Every knob reader in the derivation falls back silently on a value it doesn't recognize — right
		// for the derivation (a theme must always come out), catastrophic for an input surface. Unchecked,
		// `--knob accentStrategy=duoo` exits 0 and emits a theme that is not the one asked for.
		const algorithmFor = async () => bakedAlgorithm("xtyle-default");

		it("rejects a value outside a select's options instead of quietly deriving something else", async () => {
			const algorithm = await algorithmFor();
			expect(() => validateKnobs(algorithm, { accentStrategy: "duoo" })).toThrow(/fan \| step \| shade \| duo/);
		});

		it("rejects a knob the algorithm does not have", async () => {
			const algorithm = await algorithmFor();
			expect(() => validateKnobs(algorithm, { mood: "wistful" })).toThrow(/no knob "mood"/);
			// ...and `hour` is nxi-nite's, so it is not a knob on anyone else.
			expect(() => validateKnobs(algorithm, { hour: 3 })).toThrow(/no knob "hour"/);
			expect(validateKnobs(await bakedAlgorithm("nxi-nite"), { hour: 3 })).toEqual({ hour: 3 });
		});

		it("rejects a range that isn't a number, or is outside its bounds", async () => {
			const algorithm = await algorithmFor();
			expect(() => validateKnobs(algorithm, { surfaceRamp: "abc" })).toThrow(/takes a number/);
			expect(() => validateKnobs(algorithm, { surfaceRamp: 9 })).toThrow(/-0\.06\.\.0\.06/);
		});

		it("coerces by the declared kind, not by the value's shape", async () => {
			const algorithm = await algorithmFor();
			// The shell hands every value over as a string. Guessing the type from the string would read a
			// numeric knob's "-0.05" as a string (the derivation guards on `typeof` and would ignore it)...
			expect(validateKnobs(algorithm, { surfaceRamp: "-0.05" })).toEqual({ surfaceRamp: -0.05 });
			// ...and, in the other direction, would read a select's value as something other than a string.
			expect(validateKnobs(algorithm, { cues: "color" })).toEqual({ cues: "color" });
		});

		it("passes a composite knob through untouched — it is a structure, not a scalar to bound", async () => {
			const algorithm = await algorithmFor();
			const fonts = { sans: "Inter, sans-serif" };
			expect(validateKnobs(algorithm, { fonts })).toEqual({ fonts });
		});
	});

	describe("a discovery surface reads a knob's domain without running the algorithm", () => {
		// `xtyle knobs` and `xtyle_list_algorithms` are asked before a caller has picked any value, so
		// booting a QuickJS runtime per algorithm to report a static domain made the cheapest question the
		// most expensive one — and unanswerable at all for a pack with no baked twin. The domain now comes
		// off the mod's own declared manifest; these pin that the shortcut answers the same thing running it
		// would.
		it("reports the domain the algorithm itself declares, for every algorithm", async () => {
			const domains = await algorithmDomains(BLESSED);
			for (const domain of domains) {
				const algorithm = await bakedAlgorithm(domain.id);
				expect(domain.knobs, `${domain.id} lists knobs it does not read`).toEqual(algorithm.knobs);
				expect(domain.knobSpecs, `${domain.id} advertises a domain it does not derive with`).toEqual(algorithm.knobSpecs);
			}
		});

		it("carries a novel knob's domain through the shortcut, not just the shared ones", async () => {
			const [nite] = await algorithmDomains(["nxi-nite"]);
			expect(nite?.knobSpecs.find((s) => s.name === "hour")).toMatchObject({ kind: "range", min: 0, max: 24 });
		});
	});

	describe("a correctness harness gets its own sandbox rail", () => {
		// `xtyle gauntlet --mode hosted --depth standard|full` — the documented way to prove invariants
		// against the shipped sandboxed mods — died on `interrupted`. The sandbox's 5s rail is an
		// anti-runaway guard, not a performance budget, but a single hostile-seed derivation already runs
		// ~3s interpreted, so a deep sweep tripped it on the slowest seeds. Actually *running* the sweep
		// here would cost minutes; these pin the wiring that makes it possible.
		it("raises the rail well clear of the slowest interpreted derivation", () => {
			expect(HARNESS_TIMEOUT_MS).toBeGreaterThan(5_000);
		});

		it("keeps a raised-rail mod distinct from the production-rail one in the cache", async () => {
			// Keyed on id alone, a harness would be handed whichever instance a production caller warmed
			// first, and the raise would silently do nothing.
			const production = await resolveInstalledAlgorithm("xtyle-default");
			const harness = await resolveInstalledAlgorithm("xtyle-default", { timeoutMs: HARNESS_TIMEOUT_MS });
			expect(harness).not.toBe(production);
			// ...while still deriving the same theme: the rail is a wall-clock guard, never an input.
			expect(derive(harness, {})).toEqual(derive(production, {}));
		});
	});

	describe("the surfaces that advertise a capability accept it", () => {
		it("accepts every emitter the engine actually has, not a hand-kept copy of the list", () => {
			// Without this, an emitter added to the engine can be advertised by `xtyle_list_algorithms`
			// (which reads `emitters()` directly) and still get rejected by a tool validating against its
			// own stale enum.
			expect(formatInput.options).toContain("terminal");
		});

		it("keeps a raw NUL byte out of the source, so git reads it as text", () => {
			// A literal NUL in `qr.ts` made git classify a 250-line source file as binary: no diff, no blame,
			// no review — forever, and silently.
			const bytes = readFileSync(resolve(here, "..", "src/elements/qr.ts"));
			expect(bytes.includes(0)).toBe(false);
		});
	});
});

/** Which way a run of three surfaces walks in perceptual lightness. */
function lightnessOrder(a: string, b: string, c: string): "ascending" | "descending" | "flat" {
	const [la, lb, lc] = [a, b, c].map(luma);
	if (la < lb && lb < lc) return "ascending";
	if (la > lb && lb > lc) return "descending";
	return "flat";
}

/** Crude sRGB luma off a `#rrggbb`, enough to order three surfaces of one ramp. */
function luma(hex: string): number {
	const n = Number.parseInt(hex.replace("#", ""), 16);
	return 0.2126 * ((n >> 16) & 0xff) + 0.7152 * ((n >> 8) & 0xff) + 0.0722 * (n & 0xff);
}

import { describe, expect, it } from "vitest";
import {
	EFFECT_TOKENS,
	derive,
	effectsCss,
	formatEffectSpec,
	fxStyle,
	fxStyleAttr,
	resolveEffectArg,
	getEffect,
	listConditions,
	listEffects,
	parseEffectSpec,
	registerCondition,
	registerEffect,
	unknownEffects,
	unknownSpecs,
} from "../src/index.js";
import { bakedAlgorithm } from "../src/baked.js";

const BUILT_IN_NAMES = ["glow", "throb", "glare", "lift", "tint", "frost", "reveal", "shake", "spin", "saturate"];
const TRANSIENT_NAMES = ["flash", "float", "pop", "wobble", "shake"];

describe("the effect layer", () => {
	it("ships the blessed set, each declaring what it does under reduced motion", () => {
		expect(listEffects().map((e) => e.name)).toEqual(expect.arrayContaining(BUILT_IN_NAMES));
		for (const effect of listEffects()) {
			expect(effect.since, effect.name).toBeTruthy();
			expect(effect.tags?.length, effect.name).toBeGreaterThan(0);
		}
		expect(listConditions().map((c) => c.name)).toEqual(expect.arrayContaining(["hover", "focus", "active", "disabled"]));
	});

	it("turns for as long as the condition holds, rather than firing once like `wobble`", () => {
		const spin = getEffect("spin");
		expect(spin?.transient).toBeFalsy();
		expect(spin?.animated).toBe(true);
		expect(spin?.active).toContain("infinite");
		expect(getEffect("wobble")?.transient).toBe(true);
	});

	it("spends no intensity on a full turn, because a partial one snaps back instead of slowing", () => {
		expect(getEffect("spin")?.active).not.toContain("--fx-intensity");
		expect(effectsCss()).toContain("@keyframes xtyle-fx-spin");
	});

	it("takes a rate and a direction off the spec", () => {
		expect(parseEffectSpec("spin?rate:1.2s,direction:reverse")).toEqual([
			{ effect: "spin", condition: null, args: { rate: "1.2s", direction: "reverse" } },
		]);
		const style = fxStyle("spin?rate:1.2s,direction:reverse");
		expect(style["--fx-spin-duration"]).toBe("1.2s");
		expect(style["--fx-spin-direction"]).toBe("reverse");
	});

	it("reads a spec as effect and condition, keeping an entry no registry knows", () => {
		expect(parseEffectSpec("throb")).toEqual([{ effect: "throb", condition: null, args: {} }]);
		expect(parseEffectSpec("glow@hover lift@active")).toEqual([
			{ effect: "glow", condition: "hover", args: {} },
			{ effect: "lift", condition: "active", args: {} },
		]);
		expect(parseEffectSpec("  glow@hover   throb  ")).toHaveLength(2);
		expect(formatEffectSpec(parseEffectSpec("glow@hover throb"))).toBe("glow@hover throb");
		expect(parseEffectSpec("sparkle@hover")).toEqual([{ effect: "sparkle", condition: "hover", args: {} }]);
		expect(unknownEffects("glow@hover sparkle@hover glow@nope").map((s) => s.effect)).toEqual(["sparkle", "glow"]);
		expect(unknownEffects("glow@hover throb")).toEqual([]);
	});

	it("emits an attribute rule per effect and condition, so nothing needs a runtime", () => {
		const css = effectsCss();
		expect(css).toContain('[data-fx~="glow"]');
		expect(css).toContain('[data-fx~="glow@hover"]:hover');
		expect(css).toContain('[data-fx~="lift@active"]:active');
		expect(css).toContain('[data-fx~="glow@focus"]:focus-visible');
		expect(css).not.toContain("undefined");
		expect(css).not.toContain("NaN");
	});

	it("gives a multi-selector condition its own attribute prefix on every branch", () => {
		const css = effectsCss();
		expect(css).toContain('[data-fx][data-fx~="tint@disabled"]:disabled,[data-fx][data-fx~="tint@disabled"][aria-disabled="true"]');
	});

	it("composes every effect off the shared tokens rather than hardcoded values", () => {
		const css = effectsCss();
		for (const token of EFFECT_TOKENS) expect(css, token).toContain(token);
		expect(effectsCss({ attribute: "data-effect" })).toContain('[data-effect~="glow@hover"]:hover');
	});

	it("returns a moving effect to stillness under reduced motion, and leaves a still one alone", () => {
		const guard = effectsCss()
			.split("\n")
			.find((line) => line.startsWith("@media (prefers-reduced-motion"))!;
		expect(guard).toContain('[data-fx~="throb"]');
		expect(guard).toContain('[data-fx~="shake"]');
		expect(guard).not.toContain('[data-fx~="glow"]{');
		expect(guard).toContain("animation:none");
	});

	it("never hides content behind an effect that needs a runtime", () => {
		const css = effectsCss();
		expect(css).toContain('[data-fx~="reveal"][data-fx-armed]');
		expect(css).not.toMatch(/\[data-fx~="reveal"\]\{opacity:0/);
	});

	it("outranks a consumer's own rule rather than tying it and losing on source order", () => {
		const css = effectsCss();
		expect(css).toContain('[data-fx][data-fx~="tint@hover"]:hover');
		expect(css.split(/\r?\n/).filter((line) => line.startsWith("[data-fx~="))).toEqual([]);
	});

	it("reads named parameters, in any order and any subset", () => {
		expect(parseEffectSpec("throb?rate:3s,colors:[accent,accent-2]")[0]).toEqual({
			effect: "throb",
			condition: null,
			args: { rate: "3s", colors: "[accent,accent-2]" },
		});
		expect(parseEffectSpec("glare@hover?angle:315,rate:100ms")[0].args).toEqual({ angle: "315", rate: "100ms" });
		expect(parseEffectSpec("throb?spread:14")[0].args).toEqual({ spread: "14" });
		expect(formatEffectSpec(parseEffectSpec("glow@hover?color:pink throb"))).toBe("glow@hover?color:pink throb");
	});

	it("keeps a bracketed list intact, so its commas are items and not the pairs around it", () => {
		expect(parseEffectSpec("throb?colors:[a,b],spread:4")[0].args).toEqual({ colors: "[a,b]", spread: "4" });
		expect(fxStyle("throb?colors:[accent,accent-2]")).toEqual({
			"--fx-throb-color": "var(--accent)",
			"--fx-throb-color-alt": "var(--accent-2)",
		});
	});

	it("resolves an argument the same three ways an icon's `pc` override does", () => {
		expect(resolveEffectArg("#fff")).toBe("#fff");
		expect(resolveEffectArg("ff00ff")).toBe("#ff00ff");
		expect(resolveEffectArg("315", { name: "angle", unit: "deg" })).toBe("315deg");
		expect(resolveEffectArg("3", { name: "duration", unit: "s" })).toBe("3s");
		expect(resolveEffectArg("100ms", { name: "duration", unit: "s" })).toBe("100ms");
		expect(resolveEffectArg("accent")).toBe("var(--accent)");
		expect(resolveEffectArg("accent2")).toBe("var(--accent-2)");
		expect(resolveEffectArg("neutral-bg")).toBe("var(--neutral-bg)");
	});

	it("turns a parameterised spec into the custom properties the sheet already reads", () => {
		expect(fxStyle("throb?rate:3s,colors:[accent,accent2]")).toEqual({
			"--fx-throb-duration": "3s",
			"--fx-throb-color": "var(--accent)",
			"--fx-throb-color-alt": "var(--accent-2)",
		});
		expect(fxStyle("glare@hover?angle:315,rate:100ms,color:#fff")).toEqual({
			"--fx-glare-angle": "315deg",
			"--fx-glare-duration": "100ms",
			"--fx-glare-color": "#fff",
		});
		expect(fxStyle("glow@hover")).toEqual({});
		expect(fxStyle("saturate?amount:20,nope:1")).toEqual({ "--fx-saturate-amount": "20%" });
		expect(fxStyleAttr("glow@hover?spread:14,color:pink")).toBe("--fx-glow-spread:14px;--fx-glow-color:var(--pink)");
	});

	it("matches a parameterised token without firing a longer condition's rule", () => {
		const css = effectsCss();
		expect(css).toContain('[data-fx^="throb?"]');
		expect(css).toContain('[data-fx*=" throb?"]');
		expect(css).toContain('[data-fx^="glow@hover?"]:hover');
		expect(css).not.toContain('[data-fx*="glow@focus"]');
	});

	it("reads each parameter through its own property, falling back to the shared token", () => {
		const css = effectsCss();
		expect(css).toContain("var(--fx-glow-spread,");
		expect(css).toContain("var(--fx-throb-color-alt, var(--fx-color-alt");
		expect(css).toContain("var(--fx-glare-angle,");
	});

	it("honors saturate below the neutral exactly, and only tempers the vivify half by intensity", () => {
		const rule = effectsCss()
			.split("\n")
			.find((line) => line.startsWith('[data-fx][data-fx~="saturate"]') && line.includes("filter:"))!;
		expect(rule).toContain("saturate(calc(min(var(--fx-saturate-amount, 160%), 100%) + (max(var(--fx-saturate-amount, 160%), 100%) - 100%) * var(--fx-intensity, 1)))");
	});

	it("lets an addon's own effect be parameterised on the same terms", () => {
		registerEffect({
			name: "swirl",
			active: "transform:rotate(var(--fx-swirl-angle, 2deg))",
			params: [{ name: "angle", unit: "deg" }],
		});
		expect(fxStyle("swirl@hover?angle:7")).toEqual({ "--fx-swirl-angle": "7deg" });
	});

	it("is last-wins on the name, so an addon replaces one effect without restating the rest", () => {
		const original = getEffect("glow")!;
		const before = listEffects().length;
		try {
			registerEffect({ name: "glow", active: "filter:blur(1px)" });
			expect(listEffects().length, "replacing must not grow the set").toBe(before);
			expect(effectsCss()).toContain('[data-fx*=" glow?"]{filter:blur(1px)}');
			expect(effectsCss()).toContain('[data-fx~="throb"]');
		} finally {
			registerEffect(original);
		}
	});

	it("ships transient verbs, not only persistent-state ones", () => {
		for (const name of TRANSIENT_NAMES) {
			const effect = getEffect(name);
			expect(effect, name).toBeTruthy();
			expect(effect?.animated, `${name} moves, so reduced motion has to reach it`).toBe(true);
			expect(effect?.params?.some((param) => param.name === "rate"), `${name} rate`).toBe(true);
		}
		expect(listConditions().map((c) => c.name)).toEqual(expect.arrayContaining(["selected", "current", "busy", "fired"]));
		expect(effectsCss()).toContain('[data-fx~="flash@fired"][data-fx-fired]');
		expect(effectsCss()).toContain('[data-fx~="glow@selected"][aria-selected="true"]');
	});

	it("scales every transient by the theme's intensity, so a flattened layer really is flat", () => {
		const css = effectsCss().split("\n");
		for (const name of TRANSIENT_NAMES) {
			const own = css.filter((line) => line.includes(`--fx-${name}-`));
			expect(own.length, name).toBeGreaterThan(0);
			expect(own.some((line) => line.includes("--fx-intensity")), `${name} must read the theme's intensity`).toBe(true);
		}
	});

	it("moves a transient with the independent properties, so it composes instead of clobbering a transform", () => {
		const css = effectsCss();
		const frames = (name: string): string => css.split("\n").find((line) => line.startsWith(`@keyframes xtyle-fx-${name}`))!;
		expect(frames("float")).toContain("translate:");
		expect(frames("pop")).toContain("scale:");
		expect(frames("wobble")).toContain("rotate:");
		expect(frames("shake")).toContain("translate:");
		for (const name of ["float", "pop", "wobble", "shake"]) expect(frames(name), name).not.toContain("transform:");
	});

	it("lets an effect live entirely on its overlay, with nothing filler on the element itself", () => {
		expect(getEffect("flash")?.active).toBeUndefined();
		const css = effectsCss();
		expect(css).toContain('[data-fx~="flash@fired"][data-fx-fired]::after');
		expect(css).not.toContain('[data-fx~="flash@fired"][data-fx-fired]{}');
	});

	it("says which half of a spec was unknown, so a caller does not re-derive it", () => {
		expect(unknownSpecs("glow@hover")).toEqual([]);
		expect(unknownSpecs("glow@dragging")[0]).toMatchObject({ effect: "glow", condition: "dragging", missing: ["condition"] });
		expect(unknownSpecs("sparkle@hover")[0]).toMatchObject({ missing: ["effect"] });
		expect(unknownSpecs("sparkle@dragging")[0]?.missing).toEqual(["effect", "condition"]);
		expect(unknownSpecs("glow?nope:2,spread:4")[0]).toMatchObject({ missing: ["param"], unknownParams: ["nope"] });
		expect(unknownEffects, "the old name has to keep working").toBe(unknownSpecs);
	});

	it("lets an addon add a name the library never had, condition cross-product included", () => {
		const before = listEffects().length;
		registerEffect({ name: "sparkle", active: "outline:1px dashed currentColor" });
		registerCondition({ name: "dragging", selector: "[data-dragging]" });
		expect(listEffects().length).toBe(before + 1);
		const css = effectsCss();
		expect(css).toContain('[data-fx~="sparkle@hover"]:hover');
		expect(css).toContain('[data-fx~="glow@dragging"][data-dragging]');
		expect(unknownEffects("sparkle@dragging")).toEqual([]);
	});
});

describe("the effect tokens an algorithm answers for", () => {
	it("derives every shared token on every blessed algorithm", async () => {
		for (const id of ["xtyle-default", "xtyle-quiet", "xtyle-loud", "xtyle-hc", "nxi-nite"]) {
			const register = derive(await bakedAlgorithm(id), {});
			for (const token of EFFECT_TOKENS) expect(register[token], `${id} ${token}`).toBeTruthy();
		}
	});

	it("makes intensity the algorithm's policy, and flattens the layer entirely on high contrast", async () => {
		const intensity = async (id: string): Promise<number> => Number(derive(await bakedAlgorithm(id), {})["--fx-intensity"]);
		expect(await intensity("xtyle-hc"), "a halo spends the edge contrast hc exists to protect").toBe(0);
		expect(await intensity("xtyle-quiet")).toBeLessThan(await intensity("xtyle-default"));
		expect(await intensity("xtyle-default")).toBeLessThan(await intensity("xtyle-loud"));
		expect(await intensity("xtyle-loud")).toBeLessThanOrEqual(1.25);
	});

	it("points the effect colors at the accent pair, so a throb travels a real relationship", async () => {
		const register = derive(await bakedAlgorithm("xtyle-default"), {});
		expect(register["--fx-color"]).toBe(register["--accent"]);
		expect(register["--fx-color-alt"]).toBe(register["--accent-2"]);
	});

	it("stays overridable as a plain token, so a theme dials it with no knob", async () => {
		const register = derive(await bakedAlgorithm("xtyle-default"), { constraints: { "--fx-intensity": "0.2" } });
		expect(register["--fx-intensity"]).toBe("0.2");
	});
});

/**
 * The effect layer: a named visual behavior applied to any element under a condition.
 *
 * Tokens are values and components are things; an effect is a *verb*, and neither of the other two can
 * hold one. A token cannot say "on hover", and a component cannot decorate an element that already
 * exists without wrapping it. So an effect is its own kind, addressed by a spec string on the element
 * itself, in the same shape the icon grammar and a theme recipe already use — a name that is its spec:
 *
 * ```html
 * <span data-fx="throb">                       <!-- no condition: ambient -->
 * <a data-fx="glow@hover">
 * <button data-fx="glare@hover lift@active">
 * ```
 *
 * **It emits CSS and needs no runtime.** `[data-fx~="glow@hover"]:hover` is a plain attribute selector,
 * so the layer is a stylesheet a build step writes once. Consuming an effect never requires the engine
 * to be running, exactly as consuming a derived theme does not.
 *
 * **Its values derive.** Every effect reads the same four `--fx-*` tokens rather than hardcoding
 * numbers, so intensity is the *algorithm's* policy: `xtyle-hc` flattens the whole layer to nothing
 * because a halo eats the edge contrast it exists to protect, while a louder algorithm pushes it. No
 * hand-picked per-component glow can stay coherent across a theme set the way that does.
 *
 * **Its library is opinion, not law.** {@link registerEffect} and {@link registerCondition} are
 * last-wins on the name, and the built-ins register first — so an addon that names `glow` replaces it
 * and an addon that names `sparkle` extends the set, without either having to restate the rest. This is
 * the same registration contract fills use, for the same reason.
 */

/**
 * One tunable of an effect, addressed positionally in a spec's `:a,b,c` tail.
 *
 * A param cannot be *read* by CSS — an attribute selector can only match a token, never parse it — so
 * a param is delivered as a custom property the rule already reads through `var()`. That keeps the
 * layer a static sheet: the value arrives on the element, not in the selector.
 */
export interface EffectParam {
	/** The key an author writes (`rate`). */
	name: string;
	/** The custom property the emitted CSS reads. Defaults to `--fx-{effect}-{name}`. */
	property?: string;
	/** Appended when the author writes a bare number, so `315` can mean `315deg` and `3` mean `3s`. */
	unit?: string;
	/**
	 * The params a bracketed list fans out to, in order — `colors:[accent,accent-2]` filling `color`
	 * and `color-alt`. Sugar for the common case of setting a related pair together; a list longer than
	 * this simply stops when it runs out of targets.
	 */
	expands?: string[];
	/**
	 * The literal values this param accepts, for a param whose vocabulary is CSS keywords rather than
	 * magnitudes or colors. A bare word otherwise reads as a token reference — the grammar that makes
	 * `color:accent` mean `var(--accent)` — which would turn `direction:reverse` into `var(--reverse)`
	 * and silently drop the declaration.
	 */
	keywords?: string[];
}

/** One effect: the declarations it applies, its tunables, and how it behaves under reduced motion. */
export interface EffectDefinition {
	/** The name a spec addresses it by (`glow` in `glow@hover`). */
	name: string;
	/** A one-line summary of what the effect does, surfaced by authoring tools and the MCP catalog. */
	description?: string;
	/** Declarations applied while the effect is active. Optional, because an effect that works entirely
	 * through {@link activeAfter} — an overlay wash the target itself never carries — has nothing to put
	 * on the element, and filler written to satisfy a type is a declaration nobody meant. */
	active?: string;
	/** Declarations applied to the target whenever it carries the effect at all — transition setup, a
	 * positioning context, the resting state of a sweep. Emitted with no condition. */
	base?: string;
	/** Declarations on the target's `::after` while the effect is active, and whenever it is carried.
	 * A sweep or a wash needs a surface of its own to move across; it stays a *finish* rather than a
	 * part, because the only useful override is a value and no fill would ever own it. */
	activeAfter?: string;
	baseAfter?: string;
	/** Whether writing the bare name (no `@condition`) turns the effect on. Default true. An effect
	 * that must not fire until something arms it — `reveal`, which would otherwise hide content from a
	 * reader with no runtime — sets this false and supplies its own armed rule in {@link extra}. */
	ambient?: boolean;
	/** Rules and at-rules the effect contributes verbatim: its `@keyframes`, or a selector the cross
	 * product cannot express. Emitted once alongside the layer. */
	extra?: string;
	/** True when the effect moves. A moving effect is suppressed under `prefers-reduced-motion`, which
	 * is the whole reason this belongs in a library: the policy is decided once, correctly, rather than
	 * by every adopter who happens to remember. */
	animated?: boolean;
	/** True when the effect must be armed before it can play — it hides its target until something says
	 * the moment has come. `armInView` drives every effect declaring this, so a mod's own enter effect is
	 * observed on the same terms `reveal` is instead of being a name the runtime hardcodes. */
	arms?: boolean;
	/**
	 * Whether `--fx-intensity` scales the effect. Default true. An effect whose magnitude *is* the
	 * effect — a halo's spread, a lift's distance — degrades to absent at zero, which is the layer
	 * working. A rotation has no amplitude to spend: scaling its arc yields a partial turn that snaps
	 * back every cycle, and scaling its rate yields a slower spinner rather than a calmer one. Declaring
	 * it keeps the exemption legible instead of leaving it as an interpolation someone forgot.
	 */
	scalesWithIntensity?: boolean;
	/** True when the effect fires once and is over, rather than lasting as long as a state does. Marks
	 * the set `fireEffect` is for, so a catalog, a doc, or an authoring surface can name the transients
	 * without each one keeping its own copy of the list. */
	transient?: boolean;
	/** The version the effect first shipped in; drives a "new" marker in authoring surfaces. */
	since?: string;
	/** Plain-language taxonomy for search and filter. */
	tags?: string[];
	/** The tunables a spec may pass positionally: `throb:3s,accent,accent-2`. */
	params?: EffectParam[];
}

/** One condition: the selector suffix that decides when an effect is live. */
export interface ConditionDefinition {
	/** The name a spec addresses it by (`hover` in `glow@hover`). */
	name: string;
	/** Appended to the attribute selector. A comma splits into multiple selectors, each of which gets
	 * its own copy of the attribute prefix, so `:disabled, [aria-disabled="true"]` works as written. */
	selector: string;
	/** The attribute a runtime sets to satisfy this condition, when one can. `fired` and `armed` are
	 * driven by `@xtyle/core/fx` rather than by the browser, so the runtime has to know what to write —
	 * and reading it from here rather than hardcoding it is what lets a mod re-point either condition at
	 * an attribute of its own and still have the runtime drive it. */
	attribute?: string;
	since?: string;
}

const effects = new Map<string, EffectDefinition>();
const conditions = new Map<string, ConditionDefinition>();

/**
 * Registers an effect, **last-wins on the name**. The built-ins register first, so a later registration
 * of an existing name replaces it while a new name extends the set — an addon adds to the mix instead
 * of having to replace the whole library to change one entry.
 */
export function registerEffect(definition: EffectDefinition): void {
	effects.set(definition.name, definition);
}

/** Registers a condition, last-wins on the name, exactly as {@link registerEffect} does. */
export function registerCondition(definition: ConditionDefinition): void {
	conditions.set(definition.name, definition);
}

/** Every registered effect, in registration order (built-ins first, then whatever extended them). */
export function listEffects(): EffectDefinition[] {
	return [...effects.values()];
}

/** Every registered condition, in registration order. */
export function listConditions(): ConditionDefinition[] {
	return [...conditions.values()];
}

/** The effect registered under a name, or undefined. */
export function getEffect(name: string): EffectDefinition | undefined {
	return effects.get(name);
}

/** The condition registered under a name, or undefined. */
export function getCondition(name: string): ConditionDefinition | undefined {
	return conditions.get(name);
}

/** One entry of a `data-fx` spec: an effect, the condition it waits for (null = ambient), and the
 * positional arguments it was given. */
export interface EffectSpec {
	effect: string;
	condition: string | null;
	/** The `?key:value` arguments, in source order. Named rather than positional, so any subset can be
	 * given in any order and a new param can be added later without renumbering anyone's markup. */
	args: Record<string, string>;
}

/**
 * Parses a `data-fx` value into its entries. Whitespace-separated, each `{effect}` or
 * `{effect}@{condition}`; unknown names are kept rather than dropped, so a spec naming an effect an
 * addon has not registered *yet* round-trips through an authoring surface instead of being eaten.
 * Validate with {@link unknownEffects} when a caller wants to report the gap.
 */
export function parseEffectSpec(value: string): EffectSpec[] {
	return value
		.split(/\s+/)
		.filter(Boolean)
		.map((entry) => {
			const query = entry.indexOf("?");
			const head = query < 0 ? entry : entry.slice(0, query);
			const args = query < 0 ? {} : parseEffectArgs(entry.slice(query + 1));
			const at = head.indexOf("@");
			return at < 0
				? { effect: head, condition: null, args }
				: { effect: head.slice(0, at), condition: head.slice(at + 1), args };
		});
}

/** Splits an argument tail into `key: value` pairs, keeping a bracketed list intact so the commas
 * inside `colors:[accent,accent-2]` separate its items rather than the pairs around it. */
function parseEffectArgs(tail: string): Record<string, string> {
	const out: Record<string, string> = {};
	let depth = 0;
	let start = 0;
	const pairs: string[] = [];
	for (let i = 0; i <= tail.length; i++) {
		const char = tail[i];
		if (char === "[") depth++;
		else if (char === "]") depth--;
		if (i === tail.length || (char === "," && depth === 0)) {
			pairs.push(tail.slice(start, i));
			start = i + 1;
		}
	}
	for (const pair of pairs) {
		const colon = pair.indexOf(":");
		if (colon < 0) continue;
		const key = pair.slice(0, colon).trim();
		const raw = pair.slice(colon + 1).trim();
		if (key) out[key] = raw;
	}
	return out;
}

/** An entry of a spec that names something no registry knows, and which half of it was unknown. */
export interface UnknownSpec extends EffectSpec {
	/** Which parts did not resolve — any combination of the effect name, the condition name, and one or
	 * more parameter keys. Named rather than inferred, so a caller reporting the gap does not have to
	 * re-derive it with {@link getEffect} / {@link getCondition} per entry. */
	missing: ("effect" | "condition" | "param")[];
	/** The parameter keys the effect does not declare, when `missing` includes `param`. */
	unknownParams: string[];
}

/**
 * The entries of a spec naming an effect, a **condition**, or a parameter no registry knows — a typo,
 * or an addon that has not loaded.
 *
 * The condition half is the one that bites: `armed` is a built-in reading `[data-fx-armed]`, which makes
 * a data-attribute trigger look like part of the vocabulary rather than something
 * {@link registerCondition} has to declare, so `glow@dragging` reads as though it should just work. It
 * does not — the layer is a static cross product of *registered* names, so an unregistered one emits no
 * rule at all and is visually identical to an effect that ran and did nothing.
 */
export function unknownSpecs(value: string): UnknownSpec[] {
	const out: UnknownSpec[] = [];
	for (const spec of parseEffectSpec(value)) {
		const definition = effects.get(spec.effect);
		const known = new Set((definition?.params ?? []).map((param) => param.name));
		const unknownParams = definition ? Object.keys(spec.args).filter((key) => !known.has(key)) : [];
		const missing: ("effect" | "condition" | "param")[] = [];
		if (!definition) missing.push("effect");
		if (spec.condition !== null && !conditions.has(spec.condition)) missing.push("condition");
		if (unknownParams.length) missing.push("param");
		if (missing.length) out.push({ ...spec, missing, unknownParams });
	}
	return out;
}

/** {@link unknownSpecs} under its original name. Kept because the name says "effects" while the check
 * has always covered conditions and parameters too, which hid it from everyone looking for it. */
export const unknownEffects = unknownSpecs;

/** Serializes entries back to a `data-fx` value. */
export function formatEffectSpec(specs: EffectSpec[]): string {
	return specs
		.map(({ effect, condition, args }) => {
			const head = condition ? `${effect}@${condition}` : effect;
			const pairs = Object.entries(args).map(([key, value]) => `${key}:${value}`);
			return pairs.length ? `${head}?${pairs.join(",")}` : head;
		})
		.join(" ");
}

/**
 * Resolves one positional argument to a CSS value, in the same three shapes a `---pc` icon override
 * uses, so the two grammars stay learnable as one idea:
 *
 * - a **hex** (`#fff`, `ff00ff`) is a fixed color;
 * - a **bare number** takes the param's declared unit, so `315` reads as `315deg` and `3` as `3s`;
 * - anything else is a **token name** and resolves to `var(--name)`, which keeps it theme-reactive —
 *   `accent-2` tracks the theme rather than freezing the color it happened to be at authoring time.
 *
 * A value that already carries its own unit (`100ms`, `2rem`) passes through untouched.
 */
export function resolveEffectArg(raw: string, param?: EffectParam): string {
	const value = raw.trim();
	if (/^#?(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value) && /^#|[a-f]/i.test(value)) {
		return value.startsWith("#") ? value : `#${value}`;
	}
	if (/^-?\d*\.?\d+$/.test(value)) return param?.unit ? `${value}${param.unit}` : value;
	if (/^-?\d*\.?\d+[a-z%]+$/i.test(value)) return value;
	if (param?.keywords?.some((keyword) => keyword.toLowerCase() === value.toLowerCase())) return value.toLowerCase();
	if (/^[a-z][a-z0-9-]*$/i.test(value)) return `var(--${value.replace(/([a-z])(\d+)$/i, "$1-$2")})`;
	return value;
}

/** The custom property a param lands in: its declared one, else `--fx-{effect}-{param}`. */
export function effectParamProperty(effect: string, param: EffectParam): string {
	return param.property ?? `--fx-${effect}-${param.name}`;
}

/**
 * The inline custom properties a `data-fx` spec's arguments resolve to — the bridge between the terse
 * authored form and the static sheet.
 *
 * This is the seam that keeps the runtime optional. A binding calls it at build or SSR and writes the
 * result into `style`, so a parameterised effect costs no JavaScript at all; a page that composes its
 * markup at runtime can call it live instead. Same baked-or-generated cascade a derived theme uses.
 */
export function fxStyle(value: string): Record<string, string> {
	const out: Record<string, string> = {};
	for (const { effect, args } of parseEffectSpec(value)) {
		const params = effects.get(effect)?.params ?? [];
		const byName = new Map(params.map((param) => [param.name, param]));
		for (const [key, raw] of Object.entries(args)) {
			const param = byName.get(key);
			if (!param) continue;
			if (param.expands && raw.startsWith("[") && raw.endsWith("]")) {
				const items = raw.slice(1, -1).split(",").map((item) => item.trim()).filter(Boolean);
				param.expands.forEach((targetName, index) => {
					const item = items[index];
					const target = byName.get(targetName);
					if (item == null || !target) return;
					out[effectParamProperty(effect, target)] = resolveEffectArg(item, target);
				});
				continue;
			}
			out[effectParamProperty(effect, param)] = resolveEffectArg(raw, param);
		}
	}
	return out;
}

/** {@link fxStyle} as a `style` attribute string, for a binding that writes markup rather than props. */
export function fxStyleAttr(value: string): string {
	return Object.entries(fxStyle(value))
		.map(([property, resolved]) => `${property}:${resolved}`)
		.join(";");
}

/**
 * The tokens every effect composes from, rather than each hardcoding its own numbers. Four is
 * deliberate: a per-effect token family would grow with the library and lock a third-party effect out
 * of deriving at all, whereas a shared dial means an addon's effect answers to the theme the day it
 * lands, with no change to the algorithm that never heard of it.
 */
export const EFFECT_TOKENS = ["--fx-intensity", "--fx-color", "--fx-color-alt", "--fx-duration", "--fx-ease"] as const;

const INTENSITY = "var(--fx-intensity, 1)";
const COLOR = "var(--fx-color, currentColor)";
/** The second hue an effect travels toward. A throb that only breathes in opacity reads as a dimmer
 * switch; one that drifts between two related hues reads as alive, and the derived accent pair is
 * already guaranteed to be a relationship rather than two colors that happen to sit together. */
const COLOR_ALT = "var(--fx-color-alt, var(--fx-color, currentColor))";
const DURATION = "var(--fx-duration, var(--duration-base, 200ms))";
const EASE = "var(--fx-ease, var(--ease-standard, ease))";

/** A color mixed to `pct` of `--fx-color`, scaled by the theme's intensity so one dial flattens the
 * whole layer: at intensity `0` every effect mixes to fully transparent and the layer disappears. */
const wash = (pct: number, color = COLOR): string => `color-mix(in oklab, ${color} calc(${pct}% * ${INTENSITY}), transparent)`;
/** A per-effect override property layered over the shared token, so `glow:...,pink` repaints one effect
 * without disturbing anything else on the element that also reads `--fx-color`. */
const own = (effect: string, param: string, fallback: string): string => `var(--fx-${effect}-${param}, ${fallback})`;

const BUILT_INS: EffectDefinition[] = [
	{
		name: "glow",
		description: "A halo, the accent bloom.",
		tags: ["glow", "halo", "bloom", "light"],
		params: [{ name: "spread", unit: "px" }, { name: "color" }],
		base: `transition:filter ${DURATION} ${EASE}`,
		active: `filter:drop-shadow(0 1px calc(${own("glow", "spread", "6px")} * ${INTENSITY}) ${wash(45, own("glow", "color", COLOR))}) drop-shadow(0 0 calc(${own("glow", "spread", "6px")} * 2.1 * ${INTENSITY}) ${wash(32, own("glow", "color", COLOR))})`,
	},
	{
		name: "throb",
		description: "A slow pulse that drifts between `--fx-color` and `--fx-color-alt`.",
		tags: ["throb", "pulse", "breathe", "ambient", "attention"],
		animated: true,
		params: [
			{ name: "rate", property: "--fx-throb-duration", unit: "s" },
			{ name: "color" },
			{ name: "color-alt" },
			{ name: "colors", expands: ["color", "color-alt"] },
			{ name: "spread", unit: "px" },
		],
		active: `animation:xtyle-fx-throb ${own("throb", "duration", `calc(${DURATION} * 35)`)} linear infinite`,
		extra: `@keyframes xtyle-fx-throb{0%,100%{filter:drop-shadow(0 0 calc(${own("throb", "spread", "7px")} * 0.5 * ${INTENSITY}) ${wash(60, own("throb", "color", COLOR))}) drop-shadow(0 0 calc(${own("throb", "spread", "7px")} * 1.2 * ${INTENSITY}) ${wash(40, own("throb", "color", COLOR))})}50%{filter:drop-shadow(0 0 calc(${own("throb", "spread", "7px")} * 1.4 * ${INTENSITY}) ${wash(90, own("throb", "color-alt", COLOR_ALT))}) drop-shadow(0 0 calc(${own("throb", "spread", "7px")} * 3 * ${INTENSITY}) ${wash(65, own("throb", "color-alt", COLOR_ALT))})}}`,
	},
	{
		name: "glare",
		description: "An animated sheen that sweeps across the box.",
		tags: ["glare", "sheen", "sweep", "shine", "gloss"],
		animated: true,
		params: [{ name: "angle", unit: "deg" }, { name: "rate", property: "--fx-glare-duration", unit: "ms" }, { name: "color" }],
		base: `position:relative;overflow:hidden;isolation:isolate`,
		baseAfter: `content:"";position:absolute;inset:0;pointer-events:none;z-index:1;opacity:0;background:linear-gradient(${own("glare", "angle", "105deg")},transparent 35%,${wash(55, own("glare", "color", COLOR))} 50%,transparent 65%);transform:translateX(-120%)`,
		activeAfter: `opacity:1;animation:xtyle-fx-glare ${own("glare", "duration", `calc(${DURATION} * 4)`)} ${EASE}`,
		extra: `@keyframes xtyle-fx-glare{to{transform:translateX(120%)}}`,
	},
	{
		name: "lift",
		description: "A small rise with a shadow under it.",
		tags: ["lift", "raise", "hover", "depth", "elevate"],
		params: [{ name: "distance", unit: "px" }, { name: "color" }],
		base: `transition:transform ${DURATION} ${EASE},box-shadow ${DURATION} ${EASE}`,
		active: `transform:translateY(calc(-1 * ${own("lift", "distance", "2px")} * ${INTENSITY}));box-shadow:0 calc(${own("lift", "distance", "2px")} * 3 * ${INTENSITY}) calc(${own("lift", "distance", "2px")} * 9 * ${INTENSITY}) ${wash(28, own("lift", "color", COLOR))}`,
	},
	{
		name: "tint",
		description: "A color wash over the surface.",
		tags: ["tint", "overlay", "wash", "color"],
		params: [{ name: "amount", unit: "%" }, { name: "color" }],
		base: `transition:background-color ${DURATION} ${EASE},color ${DURATION} ${EASE}`,
		active: `background-color:color-mix(in oklab, ${own("tint", "color", COLOR)} calc(${own("tint", "amount", "14%")} * ${INTENSITY}), transparent)`,
	},
	{
		name: "frost",
		description: "A backdrop blur and saturation bump.",
		tags: ["frost", "blur", "backdrop", "glass"],
		params: [{ name: "blur", unit: "px" }, { name: "saturation", unit: "%" }],
		base: `transition:backdrop-filter ${DURATION} ${EASE}`,
		active: `backdrop-filter:blur(calc(${own("frost", "blur", "8px")} * ${INTENSITY})) saturate(calc(100% + ${own("frost", "saturation", "40%")} * ${INTENSITY}))`,
	},
	{
		name: "reveal",
		description: "Fades and slides in when armed; the one effect that needs the observer runtime.",
		tags: ["reveal", "enter", "in-view", "scroll", "fade"],
		animated: true,
		ambient: false,
		arms: true,
		params: [{ name: "distance", unit: "px" }, { name: "rate", property: "--fx-reveal-duration", unit: "ms" }],
		base: `transition:opacity ${own("reveal", "duration", DURATION)} ${EASE},transform ${own("reveal", "duration", DURATION)} ${EASE}`,
		active: `opacity:0;transform:translateY(calc(${own("reveal", "distance", "8px")} * ${INTENSITY}))`,
		extra: `[data-fx][data-fx~="reveal"][data-fx-armed],[data-fx][data-fx^="reveal?"][data-fx-armed],[data-fx][data-fx*=" reveal?"][data-fx-armed]{opacity:0;transform:translateY(calc(${own("reveal", "distance", "8px")} * ${INTENSITY}))}`,
	},
	{
		name: "shake",
		transient: true,
		description: "A short nudge, for an error.",
		tags: ["shake", "nudge", "error", "invalid", "attention"],
		animated: true,
		params: [{ name: "distance", unit: "px" }, { name: "rate", property: "--fx-shake-duration", unit: "ms" }],
		active: `animation:xtyle-fx-shake ${own("shake", "duration", `calc(${DURATION} * 2)`)} ${EASE}`,
		extra: `@keyframes xtyle-fx-shake{0%,100%{translate:0}20%,60%{translate:calc(-1 * ${own("shake", "distance", "3px")} * ${INTENSITY})}40%,80%{translate:calc(${own("shake", "distance", "3px")} * ${INTENSITY})}}`,
	},
	{
		name: "flash",
		transient: true,
		since: "0.11.0",
		description: "A hard blink of color across the surface.",
		tags: ["flash", "blink", "impact", "transient", "attention"],
		animated: true,
		params: [{ name: "color" }, { name: "amount", unit: "%" }, { name: "rate", property: "--fx-flash-duration", unit: "ms" }],
		base: `position:relative;isolation:isolate`,
		baseAfter: `content:"";position:absolute;inset:0;pointer-events:none;z-index:1;opacity:0;border-radius:inherit;background:color-mix(in oklab, ${own("flash", "color", COLOR)} calc(${own("flash", "amount", "70%")} * ${INTENSITY}), transparent)`,
		activeAfter: `animation:xtyle-fx-flash ${own("flash", "duration", `calc(${DURATION} * 1.6)`)} ${EASE}`,
		extra: `@keyframes xtyle-fx-flash{0%{opacity:0}14%{opacity:1}100%{opacity:0}}`,
	},
	{
		name: "float",
		transient: true,
		since: "0.11.0",
		description: "A rise and fade out; a readout that appears, travels, and dies.",
		tags: ["float", "rise", "drift", "transient", "readout"],
		animated: true,
		params: [{ name: "distance", unit: "px" }, { name: "rate", property: "--fx-float-duration", unit: "ms" }],
		active: `animation:xtyle-fx-float ${own("float", "duration", `calc(${DURATION} * 5)`)} ${EASE} forwards`,
		extra: `@keyframes xtyle-fx-float{from{opacity:1;translate:0 0}to{opacity:calc(1 - ${INTENSITY});translate:0 calc(-1 * ${own("float", "distance", "28px")} * ${INTENSITY})}}`,
	},
	{
		name: "pop",
		transient: true,
		since: "0.11.0",
		description: "A scale in past the resting size and back; something arriving.",
		tags: ["pop", "scale", "enter", "transient", "bounce"],
		animated: true,
		params: [{ name: "scale" }, { name: "rate", property: "--fx-pop-duration", unit: "ms" }],
		active: `animation:xtyle-fx-pop ${own("pop", "duration", `calc(${DURATION} * 1.8)`)} ${EASE}`,
		extra: `@keyframes xtyle-fx-pop{from{scale:calc(1 - ${own("pop", "scale", "0.18")} * ${INTENSITY})}55%{scale:calc(1 + ${own("pop", "scale", "0.18")} * 0.45 * ${INTENSITY})}to{scale:1}}`,
	},
	{
		name: "wobble",
		transient: true,
		since: "0.11.0",
		description: "A rotational jitter, where `shake` is a translational one.",
		tags: ["wobble", "rotate", "jitter", "transient", "attention"],
		animated: true,
		params: [{ name: "angle", unit: "deg" }, { name: "rate", property: "--fx-wobble-duration", unit: "ms" }],
		active: `animation:xtyle-fx-wobble ${own("wobble", "duration", `calc(${DURATION} * 2.5)`)} ${EASE}`,
		extra: `@keyframes xtyle-fx-wobble{0%,100%{rotate:0deg}20%,60%{rotate:calc(-1 * ${own("wobble", "angle", "4deg")} * ${INTENSITY})}40%,80%{rotate:calc(${own("wobble", "angle", "4deg")} * ${INTENSITY})}}`,
	},
	{
		name: "spin",
		since: "0.12.0",
		scalesWithIntensity: false,
		description: "A continuous rotation; the ambient \"still working\" verb, where `wobble` is a one-shot jitter.",
		tags: ["spin", "rotate", "loading", "busy", "working", "progress", "ambient", "loop"],
		animated: true,
		params: [
			{ name: "rate", property: "--fx-spin-duration", unit: "s" },
			{ name: "direction", keywords: ["normal", "reverse", "alternate", "alternate-reverse"] },
		],
		active: `animation:xtyle-fx-spin ${own("spin", "duration", `calc(${DURATION} * 6)`)} linear infinite ${own("spin", "direction", "normal")}`,
		extra: `@keyframes xtyle-fx-spin{to{rotate:360deg}}`,
	},
	{
		name: "saturate",
		description: "A vividness bump; `amount:0` is grayscale, honored exactly on every theme.",
		tags: ["saturate", "vivid", "desaturate", "grayscale", "color", "punch"],
		params: [{ name: "amount", unit: "%" }],
		base: `transition:filter ${DURATION} ${EASE}`,
		active: `filter:saturate(calc(min(${own("saturate", "amount", "160%")}, 100%) + (max(${own("saturate", "amount", "160%")}, 100%) - 100%) * ${INTENSITY}))`,
	},
];

const BUILT_IN_CONDITIONS: ConditionDefinition[] = [
	{ name: "hover", selector: ":hover" },
	{ name: "focus", selector: ":focus-visible" },
	{ name: "active", selector: ":active" },
	{ name: "checked", selector: ":checked" },
	{ name: "disabled", selector: ':disabled,[aria-disabled="true"]' },
	{ name: "open", selector: '[open],[aria-expanded="true"]' },
	{ name: "invalid", selector: ':invalid,[aria-invalid="true"]' },
	{ name: "armed", selector: "[data-fx-armed]", attribute: "data-fx-armed" },
	{ name: "selected", selector: '[aria-selected="true"],[data-selected]', since: "0.11.0" },
	{ name: "current", selector: "[aria-current],[data-current]", since: "0.11.0" },
	{ name: "busy", selector: '[aria-busy="true"],[data-busy]', since: "0.11.0" },
	{ name: "fired", selector: "[data-fx-fired]", attribute: "data-fx-fired", since: "0.11.0" },
];

for (const effect of BUILT_INS) registerEffect({ since: "0.10.0", ...effect });
for (const condition of BUILT_IN_CONDITIONS) registerCondition({ since: "0.10.0", ...condition });

/** Every selector a condition expands to, each carrying its own copy of the attribute prefix so a
 * multi-selector condition (`:disabled,[aria-disabled="true"]`) stays valid rather than losing the
 * prefix on all but its first branch. */
function conditionSelectors(attribute: string, selector: string): string {
	return selector
		.split(",")
		.map((part) => `${attribute}${part.trim()}`)
		.join(",");
}

/**
 * Every attribute selector that matches the spec token `token`, with or without a `:args` tail.
 *
 * `~=` matches a whole space-separated token, which is exact but blind to arguments: `throb:3s` is a
 * different token from `throb`. The tail is therefore matched by anchoring at a token *boundary* —
 * the start of the value, or a space — rather than by a naive substring, because `*="glow@focus"`
 * would happily fire on `glow@focus-within` and hand an author an effect they never asked for. The
 * trailing `:` is what makes the anchored form precise.
 */
function tokenSelectors(attribute: string, token: string): string[] {
	const bump = `[${attribute}]`;
	return [`${bump}[${attribute}~="${token}"]`, `${bump}[${attribute}^="${token}?"]`, `${bump}[${attribute}*=" ${token}?"]`];
}

export interface EffectsCssOptions {
	/** The attribute a spec is written in. Defaults to `data-fx`. */
	attribute?: string;
}

/**
 * The effect layer as a stylesheet: every registered effect crossed with every registered condition.
 *
 * The cross product is emitted rather than scanned for, because a static sheet cannot know which specs
 * a page will use and a scanner would break the moment a spec is composed at runtime. The layer stays
 * small regardless — each rule is a handful of declarations over shared tokens, and the whole cross
 * product of the built-in set is a few kilobytes.
 *
 * Moving effects are wrapped in a `prefers-reduced-motion: reduce` guard that returns them to no
 * animation, so an adopter cannot forget it.
 */
export function effectsCss(options: EffectsCssOptions = {}): string {
	const attr = options.attribute ?? "data-fx";
	const rules: string[] = [];
	const atRules: string[] = [];
	const animatedSelectors: string[] = [];
	for (const effect of effects.values()) {
		const ambient = tokenSelectors(attr, effect.name).join(",");
		const carries = [...tokenSelectors(attr, effect.name), `[${attr}*="${effect.name}@"]`].join(",");
		const pseudo = (selector: string): string => selector.split(",").map((sel) => `${sel}::after`).join(",");
		if (effect.base) rules.push(`${carries}{${effect.base}}`);
		if (effect.baseAfter) rules.push(`${pseudo(carries)}{${effect.baseAfter}}`);
		const live = (selector: string): void => {
			if (effect.active) rules.push(`${selector}{${effect.active}}`);
			if (effect.activeAfter) rules.push(`${pseudo(selector)}{${effect.activeAfter}}`);
			if (effect.animated) animatedSelectors.push(selector, pseudo(selector));
		};
		if (effect.ambient !== false) live(ambient);
		for (const condition of conditions.values()) {
			const scoped = tokenSelectors(attr, `${effect.name}@${condition.name}`)
				.map((sel) => conditionSelectors(sel, condition.selector))
				.join(",");
			live(scoped);
		}
		if (effect.extra) atRules.push(effect.extra);
	}
	const reduced = animatedSelectors.length
		? `@media (prefers-reduced-motion:reduce){${animatedSelectors.join(",")}{animation:none;transition:none;transform:none;translate:none;rotate:none;scale:none}}`
		: "";
	return [...rules, ...atRules, reduced].filter(Boolean).join("\n");
}

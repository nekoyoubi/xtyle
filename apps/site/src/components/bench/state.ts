import type { Algorithm, Knobs, TokenRegister } from "@xtyle/core";
import { migrateRecipe, contrast } from "@xtyle/core";
import type { ThemeRecipe } from "@xtyle/core";

export type SchemeKnob = "dark" | "light";
export type ContrastBandKnob = "aa" | "aaa";
export type DensityKnob = "compact" | "normal" | "comfortable";
export type CuesKnob = "color" | "redundant";

/** Anchor colors. Every field is optional — an unset anchor falls back to the algorithm's own default. */
export interface BenchAnchors {
	bg?: string;
	fg?: string;
	accent?: string;
}

/** Algorithm knobs. Every field is optional — an unset knob uses the engine's default. */
export interface BenchKnobs {
	scheme?: SchemeKnob;
	contrastBand?: ContrastBandKnob;
	cues?: CuesKnob;
	vibrancy?: number;
	typeScale?: number;
	radiusScale?: number;
	accentSplit?: number;
	accentShiftStep?: number;
	surfaceRamp?: number;
	density?: DensityKnob;
	hour?: number;
	fontSans?: string;
	fontMono?: string;
	fontDisplay?: string;
}

export type KnobControlKind = "select" | "range" | "text";

export interface KnobSelectOption {
	value: string;
	label: string;
}

/**
 * One rendered control in the bench's right rail — the merge of an algorithm-declared knob *domain*
 * (`kind`, range, options; from `Algorithm.knobSpecs`) with the site's *cosmetic* concerns (a
 * localized `label`, a `unit` suffix, `digits` of precision). `field` is the `BenchKnobs` key it
 * reads and writes — for the blessed scalar knobs this is the knob name itself; a novel knob writes
 * under its own name via the same channel. The rail is built from the active algorithm's own specs,
 * so a novel algorithm's knob self-renders instead of vanishing for want of a hardcoded UI entry.
 */
export interface KnobControl {
	field: string;
	label: string;
	kind: KnobControlKind;
	options?: KnobSelectOption[];
	min?: number;
	max?: number;
	step?: number;
	digits?: number;
	unit?: string;
	placeholder?: string;
	/** The value a range/toggle knob takes when first switched on from its default. */
	seed?: number;
}

/**
 * Site-owned cosmetics keyed by knob name — everything the algorithm's domain spec deliberately
 * leaves to the consumer: a localized label, digit precision, the "unset" option's wording. The
 * domain (kind, range, options, unit) comes from the algorithm; a knob absent here still renders
 * from its spec with a humanized label.
 */
interface KnobCosmetic {
	label?: string;
	digits?: number;
	/** The wording of the prepended "unset" option for a select knob. */
	defaultOption?: string;
}

const KNOB_COSMETICS: Record<string, KnobCosmetic> = {
	scheme: { defaultOption: "default (from background)" },
	accentStrategy: { defaultOption: "default (the algorithm's taste)" },
	accentSplit: { digits: 0 },
	accentShiftStep: { digits: 0 },
	hour: { digits: 0 },
};

/** The composite `fonts` knob fans out into three text stacks — a consumer-orchestrated group with no scalar domain. */
const FONT_CONTROLS: KnobControl[] = [
	{ field: "fontSans", label: "Sans font stack", kind: "text", placeholder: "algorithm default" },
	{ field: "fontMono", label: "Mono font stack", kind: "text", placeholder: "algorithm default" },
	{ field: "fontDisplay", label: "Display font stack", kind: "text", placeholder: "algorithm default" },
];

/** Title-case a raw knob name for a novel knob the site has no cosmetic label for. */
function humanizeKnob(name: string): string {
	const spaced = name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[-_]+/g, " ");
	return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Build the rail's controls for an algorithm by merging each declared knob *domain*
 * (`algorithm.knobSpecs`) with the site's cosmetics, then appending the composite font stacks when
 * the algorithm reads `fonts`. The domain drives which controls exist and their kind/range/options,
 * so the rail follows the algorithm — including a novel knob no hardcoded table anticipated.
 *
 * `scheme` is the one the theme currently derives under. A range knob's seed — the value it takes the
 * instant it is switched from "default" to "custom" — has to be the value the derivation was *already*
 * using, or flicking the toggle silently changes the theme instead of just unlocking the control.
 * `surfaceRamp` is the case that forces it: its default sign follows the scheme, so a lone static
 * default would seed an ascending stack under a light theme and invert every surface on the way in.
 */
export function knobControls(algorithm: Algorithm, scheme: SchemeKnob): KnobControl[] {
	const controls: KnobControl[] = [];
	for (const spec of algorithm.knobSpecs) {
		// INFO: a composite knob is a group the consumer assembles itself (fonts, anchors), so it has no scalar control here
		if (spec.kind === "composite") continue;
		const cosmetic = KNOB_COSMETICS[spec.name] ?? {};
		const control: KnobControl = {
			field: spec.name,
			label: cosmetic.label ?? spec.label ?? humanizeKnob(spec.name),
			kind: spec.kind,
		};
		if (spec.kind === "select") {
			control.options = [
				{ value: "", label: cosmetic.defaultOption ?? "default" },
				...(spec.options ?? []).map((o) => ({ value: o.value, label: o.label ?? o.value })),
			];
		} else if (spec.kind === "range") {
			control.min = spec.min;
			control.max = spec.max;
			control.step = spec.step;
			if (cosmetic.digits !== undefined) control.digits = cosmetic.digits;
			if (spec.unit) control.unit = spec.unit;
			const seed = spec.defaultByScheme?.[scheme] ?? spec.default;
			if (typeof seed === "number") control.seed = seed;
		}
		controls.push(control);
	}
	if (algorithm.knobs.includes("fonts")) controls.push(...FONT_CONTROLS);
	return controls;
}

/**
 * The bench's recipe. The whole point of the graduated model: an algorithm is the
 * only required choice. Anchors, knobs, and token overrides are all optional layers
 * on top — set nothing and you get the algorithm's native output; set everything and
 * you've hand-built a theme. `overrides` replaces the old per-token "pinning": any
 * token can simply be set, and it feeds back into derivation as a constraint.
 */
export interface BenchState {
	algorithm: string;
	anchors: BenchAnchors;
	knobs: BenchKnobs;
	overrides: TokenRegister;
	/**
	 * The source for an on-site authored algorithm — a `defineXtyleAlgorithm` taste vector as
	 * editable JSON. Only consulted when `algorithm === CUSTOM_ALGORITHM`; the Bench builds a
	 * live `Algorithm` from it. Stored as text so the editor keeps the author's formatting and
	 * in-progress edits intact.
	 */
	customSpec?: string;
	/**
	 * The source for an on-site authored *code* algorithm — import-free `defineAlgorithm` /
	 * `defineXtyleAlgorithm` source. Only consulted when `algorithm === CUSTOM_CODE_ALGORITHM`; the
	 * Bench loads it through the hosted xript sandbox (`loadAuthoredAlgorithm`), never the in-process
	 * path the Tier-1 `customSpec` uses, because this is arbitrary code. Deliberately NOT serialized
	 * into the share-link — a code payload must not travel to another viewer until the link schema
	 * is tier-tagged and forces the sandbox on open. It persists only in the local theme store.
	 */
	customCode?: string;
	/**
	 * A reference to a published pack whose algorithm derives this theme — an npm name, an
	 * `owner/repo`, or the URL a pack is served from, with `#name` picking one of several. Only
	 * consulted when `algorithm === PACK_ALGORITHM`; the Bench fetches it and loads it through the
	 * xript sandbox (`fetchPackAlgorithm`).
	 *
	 * Serialized into the share-link, unlike `customCode`, because it is a *pointer* rather than a
	 * payload: nothing resolves it but the sandbox, so a link cannot arrive carrying code some other
	 * tier might run in-process. The cost it does carry, stated rather than buried: the *fetch* runs
	 * in the page, so opening a shared link reaches out to whatever origin the link names before any
	 * sandbox exists. That is a beacon, not execution, and it is the price of a pack theme being
	 * shareable at all.
	 */
	packRef?: string;
}

/** The sentinel `algorithm` id for an on-site authored *taste-vector* (Tier-1, in-process). */
export const CUSTOM_ALGORITHM = "custom";
/** The sentinel `algorithm` id for an on-site authored *code* algorithm (Tier-2, sandboxed). */
export const CUSTOM_CODE_ALGORITHM = "custom-code";
/** The sentinel `algorithm` id for an algorithm fetched from a published pack (sandboxed). */
export const PACK_ALGORITHM = "pack";

export const ALGORITHMS: { id: string; label: string; blurb: string }[] = [
	{ id: "xtyle-default", label: "Default", blurb: "Balanced neutral baseline" },
	{ id: "xtyle-hc", label: "High Contrast", blurb: "Maximum legibility, AAA floors" },
	{ id: "xtyle-quiet", label: "Quiet", blurb: "Low chroma, gentle elevation" },
	{ id: "xtyle-loud", label: "Loud", blurb: "Saturated, punchy, dramatic" },
	{ id: "nxi-nite", label: "Day/Night", blurb: "Shifts warm + dim toward night, cool + bright toward day" },
	{ id: CUSTOM_ALGORITHM, label: "Custom", blurb: "Author a taste-vector algorithm inline" },
	{ id: CUSTOM_CODE_ALGORITHM, label: "Custom code", blurb: "Author an algorithm in code, run it sandboxed" },
	{ id: PACK_ALGORITHM, label: "From a pack", blurb: "Derive with a published algorithm, fetched and sandboxed" },
];

/**
 * The bench state a pack-declared theme becomes. A theme names its algorithm by id, and that id is
 * very often one the *same pack* ships, which no blessed registry can resolve. When it is not blessed,
 * the recipe is rewired onto the pack tier and pointed back at the pack it came from, so the algorithm
 * resolves through the sandbox the same way choosing it by hand would.
 */
export function statePackTheme(recipe: ThemeRecipe, ref: string): BenchState {
	const blessed = ALGORITHMS.some((entry) => entry.id === recipe.algorithm);
	const base = normalizeState(recipe as unknown as Record<string, unknown>);
	if (blessed) return base;
	const bare = ref.split("#")[0] ?? ref;
	return { ...base, algorithm: PACK_ALGORITHM, packRef: `${bare}#${recipe.algorithm}` };
}

/** The display label for an algorithm id, falling back to the raw id when unknown. */
export function algorithmLabel(id: string): string {
	return ALGORITHMS.find((a) => a.id === id)?.label ?? id;
}

/** A starting taste vector when the author first opens the custom-algorithm editor. */
export const CUSTOM_SPEC_SEED = `{
  "anchors": { "bg": "#12101a", "accent": "#c084fc" },
  "vibrancy": 0.7,
  "chroma": { "accent": 1.3, "palette": 1.2 },
  "contrast": { "floor": 4.7 }
}`;

/**
 * A starting source for the code editor. The same `defineXtyleAlgorithm` as the taste-vector tier,
 * but expressed as code that runs in the sandbox — so an author can compute fields, branch, or drop
 * to `defineAlgorithm({ derive })` for a from-scratch derivation. Import-free: the helpers are
 * supplied by the host's authoring prelude.
 */
export const CUSTOM_CODE_SEED = `// Author an algorithm in code. It runs in xript's zero-authority sandbox.
// This is the same shape as the taste-vector tier, but you can compute
// fields or drop to defineAlgorithm({ derive }) for a from-scratch build.
defineXtyleAlgorithm({
  id: "custom-code",
  anchors: { bg: "#0d1117", accent: "#58a6ff" },
  vibrancy: 0.6,
  chroma: { accent: 1.2, palette: 1.15 },
});`;

export function defaultState(): BenchState {
	return {
		algorithm: "xtyle-default",
		anchors: {},
		knobs: {},
		overrides: {},
	};
}

/** The bg/fg/accent pickers as the token constraints they now are — there is no separate anchor tier;
 * they seed `--bg-0`/`--fg-0`/`--accent` like any other provided token. */
export function anchorsToConstraints(a: BenchAnchors): TokenRegister {
	const c: TokenRegister = {};
	if (a.bg) c["--bg-0"] = a.bg;
	if (a.fg) c["--fg-0"] = a.fg;
	if (a.accent) c["--accent"] = a.accent;
	return c;
}

/**
 * Fold a recipe's legacy `anchors` into `overrides` so bg/fg/accent live in the one visible tier the
 * pickers actually edit — there is no separate anchor tier anymore. An existing override wins over the
 * folded anchor. The one heal: an anchor `fg` is a *friendly seed*, not a hard pin — if it was captured
 * from a dark-theme default and now sits unreadably on the surface the theme actually set (a stored
 * recipe that overrode `--bg-0` light but never touched fg), drop it so the foreground re-derives to the
 * scheme. Only an anchor fg qualifies: an explicit `--fg-0` override is the real escape hatch and stays,
 * and a readable fg stays as a visible override — so a neutral theme keeps its pinned surfaces rather
 * than collapsing to an accent-washed one.
 */
export function foldLegacyAnchors(anchors: BenchAnchors, overrides: TokenRegister): TokenRegister {
	const merged: TokenRegister = { ...anchorsToConstraints(anchors), ...overrides };
	const fgFromAnchor = anchors.fg !== undefined && overrides["--fg-0"] === undefined;
	const bg = merged["--bg-0"];
	const fg = merged["--fg-0"];
	if (fgFromAnchor && bg && fg && readableRatio(fg, bg) < 4.5) delete merged["--fg-0"];
	return merged;
}

/** Contrast between two token color strings, or a safe "readable" fallback when either can't be parsed. */
function readableRatio(fg: string, bg: string): number {
	try {
		const ratio = contrast(fg, bg);
		return Number.isFinite(ratio) ? ratio : 21;
	} catch {
		return 21;
	}
}

/** Build the `Knobs` payload `derive` consumes, omitting every unset knob so the engine applies its own default. */
export function toDeriveKnobs(k: BenchKnobs): Knobs {
	const out: Knobs = {};
	const fonts: Record<string, string> = {};
	// INFO: copy by key (not a fixed whitelist) so a novel knob a custom algorithm declares beyond
	// BenchKnobs still reaches derive(); the three font stacks are the only ones folded into a group
	for (const [key, value] of Object.entries(k as Record<string, unknown>)) {
		if (value === undefined || value === "") continue;
		if (key === "fontSans") fonts.sans = value as string;
		else if (key === "fontMono") fonts.mono = value as string;
		else if (key === "fontDisplay") fonts.display = value as string;
		else (out as Record<string, unknown>)[key] = value;
	}
	if (Object.keys(fonts).length) out.fonts = fonts;
	return out;
}

/** Rewrite a recipe off any algorithm the engine has retired. The map itself lives in `@xtyle/core`
 * beside the theme-file format, so the CLI, the MCP server, and any third-party consumer read an
 * older recipe the same way the bench does; this is just the bench's call into it. */
export function retireAlgorithm(
	algorithm: string,
	knobs: BenchKnobs,
): { algorithm: string; knobs: BenchKnobs } {
	const migrated = migrateRecipe({ algorithm, knobs });
	return { algorithm: migrated.algorithm, knobs: migrated.knobs as BenchKnobs };
}

/** Accept recipes from older shapes (concrete anchors, `pins`, a retired algorithm) and normalize. */
export function normalizeState(raw: unknown): BenchState {
	const base = defaultState();
	if (!raw || typeof raw !== "object") return base;
	const r = raw as Record<string, unknown>;
	const anchors = (r.anchors as BenchAnchors) ?? {};
	const retired = retireAlgorithm(
		typeof r.algorithm === "string" ? r.algorithm : base.algorithm,
		((r.knobs as BenchKnobs) ?? {}),
	);
	const overrides = (r.overrides ?? r.pins ?? {}) as TokenRegister;
	const normalized: BenchState = {
		algorithm: retired.algorithm,
		anchors: {},
		knobs: { ...retired.knobs },
		overrides: foldLegacyAnchors(anchors, { ...overrides }),
	};
	if (typeof r.customSpec === "string") normalized.customSpec = r.customSpec;
	if (typeof r.customCode === "string") normalized.customCode = r.customCode;
	if (typeof r.packRef === "string") normalized.packRef = r.packRef;
	return normalized;
}

/** A knob value as a JS object-literal fragment: the `fonts` group prints with bare keys, every scalar
 * as JSON. Fed the output of `toDeriveKnobs`, so the export lists exactly what derives — no per-knob
 * whitelist to fall out of sync when a knob (blessed or novel) is added. */
function knobLiteral(value: unknown): string {
	if (value && typeof value === "object") {
		const body = Object.entries(value as Record<string, unknown>)
			.map(([key, v]) => `${key}: ${JSON.stringify(v)}`)
			.join(", ");
		return `{ ${body} }`;
	}
	return JSON.stringify(value);
}

/** A pasteable `derive(...)` invocation that reproduces the current state — only the layers actually set.
 * A `name` prints as a leading comment so the snippet is self-identifying once copied out. */
export function toInvocation(state: BenchState, name?: string): string {
	const header = name?.trim() ? [`// ${name.trim().replace(/\r?\n/g, " ")}`, ""] : [];
	const knobEntries = Object.entries(toDeriveKnobs(state.knobs)).map(
		([key, value]) => `${key}: ${knobLiteral(value)}`,
	);
	const optionLines: string[] = [];
	if (knobEntries.length) optionLines.push(`  knobs: { ${knobEntries.join(", ")} }`);
	const constraints = { ...anchorsToConstraints(state.anchors), ...state.overrides };
	const overrideKeys = Object.keys(constraints);
	if (overrideKeys.length) {
		const body = overrideKeys
			.map((key) => `    ${JSON.stringify(key)}: ${JSON.stringify(constraints[key])}`)
			.join(",\n");
		optionLines.push(`  constraints: {\n${body}\n  }`);
	}
	const options = optionLines.length ? `, {\n${optionLines.join(",\n")}\n}` : "";
	if (state.algorithm === PACK_ALGORITHM) {
		return [
			...header,
			`import { derive } from "@xtyle/core";`,
			`import { fetchPackAlgorithm } from "@xtyle/core/host/remote";`,
			``,
			`const algorithm = await fetchPackAlgorithm(${JSON.stringify(state.packRef ?? "")});`,
			`const register = derive(algorithm${options});`,
		].join("\n");
	}
	if (state.algorithm === CUSTOM_CODE_ALGORITHM) {
		const codeBody = (state.customCode ?? "").trim();
		return [
			...header,
			`import { derive, loadAuthoredAlgorithm } from "@xtyle/core";`,
			``,
			`const algorithm = await loadAuthoredAlgorithm(\``,
			codeBody,
			`\`);`,
			`const register = derive(algorithm${options});`,
		].join("\n");
	}
	if (state.algorithm === CUSTOM_ALGORITHM) {
		const specBody = (state.customSpec ?? "{}").trim();
		return [
			...header,
			`import { derive } from "@xtyle/core";`,
			`import { makeXtyleAlgorithm, toPreset } from "@xtyle/core/authoring";`,
			``,
			`const algorithm = makeXtyleAlgorithm(`,
			`\ttoPreset({ id: "custom", ...${specBody} }),`,
			`);`,
			`const register = derive(algorithm${options});`,
		].join("\n");
	}
	return [
		...header,
		`import { derive } from "@xtyle/core";`,
		`import { getAlgorithm } from "@xtyle/core/algorithms";`,
		``,
		`const register = derive(getAlgorithm(${JSON.stringify(state.algorithm)})${options});`,
	].join("\n");
}

interface Serialized {
	a: string;
	an: BenchAnchors;
	k: BenchKnobs;
	o: TokenRegister;
	cs?: string;
	pr?: string;
}

function base64Encode(json: string): string {
	const bytes = new TextEncoder().encode(json);
	let binary = "";
	for (const b of bytes) binary += String.fromCharCode(b);
	return btoa(binary).replace(/=+$/, "");
}

function base64Decode(b64: string): string {
	const binary = atob(b64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return new TextDecoder().decode(bytes);
}

export function encodeState(state: BenchState): string {
	const payload: Serialized = {
		a: state.algorithm,
		an: state.anchors,
		k: state.knobs,
		o: state.overrides,
	};
	if (state.customSpec !== undefined) payload.cs = state.customSpec;
	if (state.packRef !== undefined) payload.pr = state.packRef;
	// SAFETY: customCode is deliberately not serialized — a code payload must not travel via URL until
	// the link schema is tier-tagged and forces the sandbox on open
	return base64Encode(JSON.stringify(payload));
}

export function decodeState(hash: string): BenchState | null {
	try {
		const parsed = JSON.parse(base64Decode(hash)) as Partial<Serialized> & { p?: TokenRegister };
		return normalizeState({
			algorithm: parsed.a,
			anchors: parsed.an,
			knobs: parsed.k,
			overrides: parsed.o ?? parsed.p,
			customSpec: parsed.cs,
			packRef: parsed.pr,
		});
	} catch {
		return null;
	}
}

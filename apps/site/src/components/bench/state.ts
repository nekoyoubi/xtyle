import type { Knobs, TokenRegister } from "@xtyle/core";

export type SchemeKnob = "dark" | "light";
export type ContrastBandKnob = "aa" | "aaa";
export type DensityKnob = "compact" | "normal" | "comfortable";

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
	vibrancy?: number;
	typeScale?: number;
	radiusScale?: number;
	accentSplit?: number;
	density?: DensityKnob;
	hour?: number;
	fontSans?: string;
	fontMono?: string;
	fontDisplay?: string;
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
}

/** The sentinel `algorithm` id for an on-site authored *taste-vector* (Tier-1, in-process). */
export const CUSTOM_ALGORITHM = "custom";
/** The sentinel `algorithm` id for an on-site authored *code* algorithm (Tier-2, sandboxed). */
export const CUSTOM_CODE_ALGORITHM = "custom-code";

export const ALGORITHMS: { id: string; label: string; blurb: string }[] = [
	{ id: "xtyle-default", label: "Default", blurb: "Balanced neutral baseline" },
	{ id: "xtyle-hc", label: "High Contrast", blurb: "Maximum legibility, AAA floors" },
	{ id: "xtyle-quiet", label: "Quiet", blurb: "Low chroma, gentle elevation" },
	{ id: "xtyle-loud", label: "Loud", blurb: "Saturated, punchy, dramatic" },
	{ id: "nxi-nite", label: "Day/Night", blurb: "Shifts warm + dim toward night, cool + bright toward day" },
	{ id: CUSTOM_ALGORITHM, label: "Custom", blurb: "Author a taste-vector algorithm inline" },
	{ id: CUSTOM_CODE_ALGORITHM, label: "Custom code", blurb: "Author an algorithm in code, run it sandboxed" },
];

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

/** Sensible starting points when a knob is first switched from default to custom. */
export const KNOB_SEEDS = {
	scheme: "dark" as SchemeKnob,
	contrastBand: "aa" as ContrastBandKnob,
	vibrancy: 0.5,
	typeScale: 1.2,
	radiusScale: 1,
	accentSplit: 45,
	density: "normal" as DensityKnob,
	hour: 12,
} as const;

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

/** Build the `Knobs` payload `derive` consumes, omitting every unset knob so the engine applies its own default. */
export function toDeriveKnobs(k: BenchKnobs): Knobs {
	const out: Knobs = {};
	if (k.scheme) out.scheme = k.scheme;
	if (k.contrastBand) out.contrastBand = k.contrastBand;
	if (k.vibrancy !== undefined) out.vibrancy = k.vibrancy;
	if (k.typeScale !== undefined) out.typeScale = k.typeScale;
	if (k.radiusScale !== undefined) out.radiusScale = k.radiusScale;
	if (k.accentSplit !== undefined) out.accentSplit = k.accentSplit;
	if (k.density) out.density = k.density;
	if (k.hour !== undefined) out.hour = k.hour;
	const fonts: Record<string, string> = {};
	if (k.fontSans) fonts.sans = k.fontSans;
	if (k.fontMono) fonts.mono = k.fontMono;
	if (k.fontDisplay) fonts.display = k.fontDisplay;
	if (Object.keys(fonts).length) out.fonts = fonts;
	return out;
}

/** Accept recipes from older shapes (concrete anchors, `pins`) and normalize to the optional model. */
export function normalizeState(raw: unknown): BenchState {
	const base = defaultState();
	if (!raw || typeof raw !== "object") return base;
	const r = raw as Record<string, unknown>;
	const anchors = (r.anchors as BenchAnchors) ?? {};
	const knobs = (r.knobs as BenchKnobs) ?? {};
	const overrides = (r.overrides ?? r.pins ?? {}) as TokenRegister;
	const normalized: BenchState = {
		algorithm: typeof r.algorithm === "string" ? r.algorithm : base.algorithm,
		anchors: { ...anchors },
		knobs: { ...knobs },
		overrides: { ...overrides },
	};
	if (typeof r.customSpec === "string") normalized.customSpec = r.customSpec;
	if (typeof r.customCode === "string") normalized.customCode = r.customCode;
	return normalized;
}

/** A pasteable `derive(...)` invocation that reproduces the current state — only the layers actually set. */
export function toInvocation(state: BenchState): string {
	const a = state.anchors;
	const anchorEntries = (["bg", "fg", "accent"] as const)
		.filter((key) => a[key] !== undefined)
		.map((key) => `${key}: ${JSON.stringify(a[key])}`);
	const k = state.knobs;
	const knobEntries = [
		...(k.scheme ? [`scheme: ${JSON.stringify(k.scheme)}`] : []),
		...(k.contrastBand ? [`contrastBand: ${JSON.stringify(k.contrastBand)}`] : []),
		...(k.vibrancy !== undefined ? [`vibrancy: ${k.vibrancy}`] : []),
		...(k.typeScale !== undefined ? [`typeScale: ${k.typeScale}`] : []),
		...(k.radiusScale !== undefined ? [`radiusScale: ${k.radiusScale}`] : []),
		...(k.accentSplit !== undefined ? [`accentSplit: ${k.accentSplit}`] : []),
		...(k.density ? [`density: ${JSON.stringify(k.density)}`] : []),
		...(k.hour !== undefined ? [`hour: ${k.hour}`] : []),
	];
	const optionLines: string[] = [];
	if (anchorEntries.length) optionLines.push(`  anchors: { ${anchorEntries.join(", ")} }`);
	if (knobEntries.length) optionLines.push(`  knobs: { ${knobEntries.join(", ")} }`);
	const overrideKeys = Object.keys(state.overrides);
	if (overrideKeys.length) {
		const body = overrideKeys
			.map((key) => `    ${JSON.stringify(key)}: ${JSON.stringify(state.overrides[key])}`)
			.join(",\n");
		optionLines.push(`  constraints: {\n${body}\n  }`);
	}
	const options = optionLines.length ? `, {\n${optionLines.join(",\n")}\n}` : "";
	if (state.algorithm === CUSTOM_CODE_ALGORITHM) {
		const codeBody = (state.customCode ?? "").trim();
		return [
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
	// `customCode` is deliberately NOT serialized: a code payload must not travel to another viewer
	// via a URL until the link schema is tier-tagged and forces the sandbox on open.
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
		});
	} catch {
		return null;
	}
}

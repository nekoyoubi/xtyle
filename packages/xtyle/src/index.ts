import { clamp01, formatCss, hueDelta, oklch, toOklchColor, type OklchColor } from "./color.js";
import { constraintsFrom } from "./constraints.js";
import type { Algorithm, Constraints, DeriveOptions, DeriveTrace, Scheme, TokenRegister } from "./types.js";

const KNOWN_DERIVE_OPTS = new Set<keyof DeriveOptions>(["knobs", "constraints", "anchors", "invert"]);

/** The `--bg-*`/`--fg-*` counterparts an inversion exchanges: the surface ladder against the text ladder. */
const INVERT_PAIRS: ReadonlyArray<readonly [string, string]> = [
	["--bg-0", "--fg-0"],
	["--bg-1", "--fg-1"],
	["--bg-2", "--fg-2"],
	["--bg-3", "--fg-3"],
];

/** The seed tokens an inversion actually turns — the "invocation", the minimum an algorithm needs to derive
 * everything else. Swapping the two surface/ink seeds and flipping the scheme lets the algorithm re-derive
 * every downstream token natively for the opposite mode; the accent is identity and rides through unchanged. */
const SEED_TOKENS = ["--bg-0", "--fg-0", "--accent"] as const;
const SEED_SET: ReadonlySet<string> = new Set(SEED_TOKENS);

/** An override within this OKLCH distance of what the algorithm derives on its own reads as "not really
 * customized" and is dropped, so the token re-derives natively for the flipped scheme rather than carrying a
 * stale value across it. */
const NATIVE_EPSILON = 0.02;

/** Exchange each *pinned* `--bg-N`/`--fg-N` with its counterpart; a lone side moves across rather than
 * pinning a stale mate, so only what was pinned stays pinned and the unpinned side re-derives. */
export function invertBgFg(constraints: Constraints): Constraints {
	const out: Constraints = { ...constraints };
	for (const [bg, fg] of INVERT_PAIRS) {
		const bgVal = constraints[bg];
		const fgVal = constraints[fg];
		if (fgVal !== undefined) out[bg] = fgVal;
		else delete out[bg];
		if (bgVal !== undefined) out[fg] = bgVal;
		else delete out[fg];
	}
	return out;
}

function hueMatches(a: OklchColor, b: OklchColor): boolean {
	if (a.c < NATIVE_EPSILON && b.c < NATIVE_EPSILON) return true;
	return Math.abs(hueDelta(a.h, b.h)) < 4;
}

/**
 * Re-project each derived-token override onto the flipped scheme *through the algorithm*, not by hand.
 * `native` is what the algorithm derives from the seeds alone in the base scheme; `flipped` is what it derives
 * from the swapped seeds in the opposite scheme. An override that matches its native value is dropped, so the
 * token re-derives cleanly — a pinned `--surface-overlay` becomes the algorithm's light-scheme overlay rather
 * than a stale dark one, which is the whole point: the engine already knows where every surface sits in either
 * mode. A genuine customization rides along as its offset from native — the lightness offset re-applied over
 * the flipped-scheme base, the author's own hue and chroma kept. Seeds are handled by the swap; alpha overlays
 * (scrims, state washes) and tokens the algorithm never derives (no native to anchor to) pass through.
 */
function reprojectOverrides(
	constraints: Constraints,
	native: TokenRegister,
	flipped: TokenRegister,
): Constraints {
	const out: Constraints = {};
	for (const [token, value] of Object.entries(constraints)) {
		if (SEED_SET.has(token)) continue;
		if (typeof value !== "string") {
			out[token] = value;
			continue;
		}
		let pinned: OklchColor;
		let base: OklchColor;
		let target: OklchColor;
		try {
			pinned = toOklchColor(value);
			const nativeValue = native[token];
			const flippedValue = flipped[token];
			if (nativeValue === undefined || flippedValue === undefined) throw new Error("no native anchor");
			base = toOklchColor(nativeValue);
			target = toOklchColor(flippedValue);
		} catch {
			out[token] = value;
			continue;
		}
		if (pinned.alpha < 1) {
			out[token] = value;
			continue;
		}
		const offset = pinned.l - base.l;
		if (
			Math.abs(offset) < NATIVE_EPSILON &&
			Math.abs(pinned.c - base.c) < NATIVE_EPSILON &&
			hueMatches(pinned, base)
		) {
			continue;
		}
		out[token] = formatCss(oklch(clamp01(target.l + offset), pinned.c, pinned.h));
	}
	return out;
}

/**
 * Normalize a derive request: reject an unknown option key loudly, and fold the deprecated
 * `anchors` alias down into `constraints` so the algorithm sees one channel. A seed passed
 * through a shape the engine doesn't read (`{ seeds: … }`, `{ inputs: … }`) would otherwise
 * be silently dropped and return a register built from the default accent — a plausible-looking
 * wrong result — so an unknown key throws instead. An explicit `constraints` entry wins over an
 * `anchors` value for the same token. `invert` is not resolved here — it is a post-derivation
 * flip (see {@link invertedOptions}), not a seed transform.
 */
function resolveDeriveOpts(opts: DeriveOptions): DeriveOptions {
	const unknown = Object.keys(opts).filter((k) => !KNOWN_DERIVE_OPTS.has(k as keyof DeriveOptions));
	if (unknown.length > 0) {
		throw new TypeError(
			`derive: unknown option ${unknown.map((k) => `"${k}"`).join(", ")}. ` +
				`Seed a theme through \`constraints\` ({ constraints: { "--accent": "#7c5cff" } }). ` +
				`Valid options: ${[...KNOWN_DERIVE_OPTS].join(", ")}.`,
		);
	}
	const { anchors, invert: _invert, ...rest } = opts;
	if (!anchors) return rest;
	const merged: Constraints = { ...constraintsFrom(anchors), ...rest.constraints };
	return { ...rest, constraints: merged };
}

/**
 * The derive options for a theme's inverted counterpart, driven from the **invocation** (the seeds) rather
 * than the materialized token set. Inversion turns only what an algorithm needs to derive the rest: the two
 * surface/ink seeds swap and the scheme flips, then the algorithm re-derives the whole downstream ladder
 * natively for the opposite mode — so a `--surface-overlay` lands where the algorithm puts it in the flipped
 * scheme, not on a hand-mirrored guess. The native base and the natively-flipped register are derived from the
 * seeds alone; any derived-token override is then re-projected against them ({@link reprojectOverrides}), so an
 * untouched override re-derives cleanly and a real customization rides across as its offset from native.
 * Exported so a caller can *materialize* the inversion into a standalone theme, not just pass `invert: true`.
 */
export function invertedOptions(algorithm: Algorithm, opts: DeriveOptions = {}): DeriveOptions {
	const resolved = resolveDeriveOpts(opts);
	const constraints = resolved.constraints ?? {};
	const seeds: Constraints = {};
	for (const token of SEED_TOKENS) {
		if (constraints[token] !== undefined) seeds[token] = constraints[token];
	}
	const native = algorithm.derive({ ...resolved, constraints: seeds });
	const scheme: Scheme = native["--scheme"] === "light" ? "dark" : "light";
	const invertedKnobs = { ...resolved.knobs, scheme };
	const flipped = algorithm.derive({ ...resolved, knobs: invertedKnobs, constraints: invertBgFg(seeds) });
	return {
		...resolved,
		knobs: invertedKnobs,
		constraints: { ...invertBgFg(seeds), ...reprojectOverrides(constraints, native, flipped) },
	};
}

export function derive(algorithm: Algorithm, opts: DeriveOptions = {}): TokenRegister {
	return algorithm.derive(opts.invert ? invertedOptions(algorithm, opts) : resolveDeriveOpts(opts));
}

/**
 * Derives a theme while retaining every intermediate pass snapshot. Delegates to the
 * algorithm's own `deriveTraced` when present (baked pipelines and host facades both
 * provide it); for a bare single-pass algorithm with no traced implementation, it
 * synthesizes a one-snapshot trace from `derive`. The last snapshot equals `derive(opts)` —
 * including the post-derivation flip when `invert` is set.
 */
export function deriveTraced(algorithm: Algorithm, opts: DeriveOptions = {}): DeriveTrace {
	const resolved = opts.invert ? invertedOptions(algorithm, opts) : resolveDeriveOpts(opts);
	if (algorithm.deriveTraced) return algorithm.deriveTraced(resolved);
	const register = algorithm.derive(resolved);
	return { register, trace: [{ name: "derive", register }] };
}

export * from "./types.js";
export * from "./vocab.js";
export * from "./reveal-shapes.js";
export * from "./icon-shapes.js";
export * from "./icons.js";
export * from "./icon-registry.js";
export * from "./icon-builder.js";
export * from "./icon-measure.js";
export * from "./effects.js";
export * from "./fx.js";
export * from "./fonts/google.js";
export * from "./fonts/embed.js";
export * from "./token-meta.js";
export * from "./color.js";
export * from "./audit.js";
export * from "./convert.js";
export * from "./series.js";
export * from "./timeseries.js";
export { encodeQr, qrPath } from "./qr.js";
export type { QrEcLevel, QrMatrix, QrModuleShape, EncodeQrOptions, QrPathOptions, QrPath } from "./qr.js";
export type { QrMode, QrIconSize } from "./markup/qr.js";
export { qrLogoModules, qrLinkHref, QR_LOGO_SCALE, QR_ICON_SCALES, QR_ICON_SIZES } from "./markup/qr.js";
export { constraintsFrom } from "./constraints.js";
export { tableParts } from "./markup/table.js";
export { avatarInitials } from "./markup/avatar.js";
export { schemeToggleGlyphs, schemeToggleHostClass } from "./markup/scheme-toggle.js";
export type { SchemeToggleGlyphOptions, SchemeToggleClassOptions } from "./markup/scheme-toggle.js";
export type { TablePart } from "./markup/table.js";
export { resolveSparklineBounds, formatSparklineValue } from "./markup/sparkline.js";
export { resolveChartPlot, CHART_VARIANTS, CHART_CURVES, CHART_X_SCALES } from "./markup/chart.js";
export { hoverMediaHtml } from "./markup/image.js";
export {
	renderBbcode,
	registerBbcodeTags,
	defineBbcodeVocabulary,
	onBbcodeRegistryChanged,
	bbcodeVocabulary,
	bbcodeVocabularies,
	bbcodeTags,
	DEFAULT_VOCABULARY,
} from "./markup/bbcode.js";
export type { BbcodeTag, BbcodeTagContext, BbcodeOptions } from "./markup/bbcode.js";
export type {
	BarSeries,
	BarScheme,
	ChartSeries,
	ChartScheme,
	ChartVariant,
	ChartCurve,
	ChartXScale,
	ChartPlot,
	ChartPlotSeries,
	ChartPlotOptions,
	HeatmapScheme,
	PieDatum,
	PieScheme,
	PieVariant,
	SparklineVariant,
	SparklineTone,
	SparklineBounds,
	SparklineFormat,
	ImageFit,
	ImageRadius,
	ImageLoading,
	ImageTrigger,
	ImageHoverAudio,
	DialogSize,
	SheetSide,
	SheetSize,
	TreeNode,
	TreeAction,
	TreeBadge,
} from "./markup/index.js";
export * from "./graph.js";
export {
	emit,
	emitCss,
	emitJson,
	emitMonaco,
	emitPrism,
	emitTerminal,
	emitters,
	registerEmitter,
} from "./emit/index.js";
export { coverage, coverComponent, coverComponents } from "./coverage.js";
export { validateKnobs } from "./knobs.js";
export {
	THEME_FILE_FORMAT,
	THEME_FILE_VERSION,
	THEME_FILE_SCHEMA_URL,
	buildThemeFile,
	serializeThemeFile,
	isThemeFile,
	parseThemeFile,
	migrateRecipe,
	migratedTarget,
	type ThemeFileMeta,
	type ThemeRecipe,
	type XtyleThemeFile,
} from "./theme-file.js";
export {
	type Binding,
	type ComponentCategory,
	type AnatomyPart,
	type PropDef,
	type VariantDef,
	type SizeDef,
	type StateDef,
	type SlotDef,
	type ComponentExample,
	type ComponentManifest,
	type ComponentRegistry,
	components,
	getComponent,
	listComponents,
	diagnoseAuthoring,
	warnAuthoring,
	tokensInCss,
	declaredPropsInCss,
	styleQueriedTokensInCss,
	styleQueryPairsInCss,
	consumedTokensInCss,
	lintManifest,
	lintStyleQueryDomains,
	lintHostControls,
} from "./manifest/index.js";
export { gauntlet } from "./gauntlet.js";
export type {
	GauntletOptions,
	GauntletReport,
	GauntletFailure,
} from "./gauntlet.js";
export {
	makeXtyleAlgorithm,
	makeXtylePipelineAlgorithm,
	runPipeline,
	settlePass,
	registerToNodes,
	resolveBaseInputs,
	buildPassContext,
	DEFAULT_ANCHORS,
	SHARED_KNOBS,
	SHARED_KNOB_SPECS,
	resolveKnobSpecs,
	KEYWORD_DOMAINS,
	type PresetDefaults,
	type PresetAnchors,
} from "./algorithms/factory.js";
export { loadAlgorithm, loadAuthoredAlgorithm } from "./host/index.js";

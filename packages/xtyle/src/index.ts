import { constraintsFrom } from "./constraints.js";
import type { Algorithm, DeriveOptions, DeriveTrace, TokenRegister } from "./types.js";

const KNOWN_DERIVE_OPTS = new Set<keyof DeriveOptions>(["knobs", "constraints", "anchors"]);

/**
 * Normalize a derive request: reject an unknown option key loudly, and fold the
 * friendly `anchors` seed shape down into `constraints` so the algorithm sees one
 * channel. A seed passed through a shape the engine doesn't read (`{ seeds: … }`,
 * `{ inputs: … }`) would otherwise be silently dropped and return a register built
 * from the default accent — a plausible-looking wrong result — so an unknown key
 * throws instead. An explicit `constraints` entry wins over an `anchors` value for
 * the same token.
 */
function resolveDeriveOpts(opts: DeriveOptions): DeriveOptions {
	const unknown = Object.keys(opts).filter((k) => !KNOWN_DERIVE_OPTS.has(k as keyof DeriveOptions));
	if (unknown.length > 0) {
		throw new TypeError(
			`derive: unknown option ${unknown.map((k) => `"${k}"`).join(", ")}. ` +
				`Seed a theme through \`anchors\` ({ anchors: { accent: "#7c5cff" } }) or ` +
				`\`constraints\` ({ constraints: { "--accent": "#7c5cff" } }). ` +
				`Valid options: ${[...KNOWN_DERIVE_OPTS].join(", ")}.`,
		);
	}
	if (!opts.anchors) return opts;
	const { anchors, constraints, ...rest } = opts;
	return { ...rest, constraints: { ...constraintsFrom(anchors), ...constraints } };
}

export function derive(algorithm: Algorithm, opts: DeriveOptions = {}): TokenRegister {
	return algorithm.derive(resolveDeriveOpts(opts));
}

/**
 * Derives a theme while retaining every intermediate pass snapshot. Delegates to the
 * algorithm's own `deriveTraced` when present (baked pipelines and host facades both
 * provide it); for a bare single-pass algorithm with no traced implementation, it
 * synthesizes a one-snapshot trace from `derive`. The last snapshot equals `derive(opts)`.
 */
export function deriveTraced(algorithm: Algorithm, opts: DeriveOptions = {}): DeriveTrace {
	const resolved = resolveDeriveOpts(opts);
	if (algorithm.deriveTraced) return algorithm.deriveTraced(resolved);
	const register = algorithm.derive(resolved);
	return { register, trace: [{ name: "derive", register }] };
}

export * from "./types.js";
export * from "./vocab.js";
export * from "./icons.js";
export * from "./icon-builder.js";
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
export type { TablePart } from "./markup/table.js";
export { resolveSparklineBounds, formatSparklineValue } from "./markup/sparkline.js";
export { hoverMediaHtml } from "./markup/image.js";
export type {
	BarSeries,
	BarScheme,
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

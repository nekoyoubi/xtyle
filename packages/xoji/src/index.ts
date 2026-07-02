import type { Algorithm, DeriveOptions, DeriveTrace, TokenRegister } from "./types.js";

export function derive(algorithm: Algorithm, opts: DeriveOptions = {}): TokenRegister {
	return algorithm.derive(opts);
}

/**
 * Derives a theme while retaining every intermediate pass snapshot. Delegates to the
 * algorithm's own `deriveTraced` when present (baked pipelines and host facades both
 * provide it); for a bare single-pass algorithm with no traced implementation, it
 * synthesizes a one-snapshot trace from `derive`. The last snapshot equals `derive(opts)`.
 */
export function deriveTraced(algorithm: Algorithm, opts: DeriveOptions = {}): DeriveTrace {
	if (algorithm.deriveTraced) return algorithm.deriveTraced(opts);
	const register = algorithm.derive(opts);
	return { register, trace: [{ name: "derive", register }] };
}

export * from "./types.js";
export * from "./vocab.js";
export * from "./token-meta.js";
export * from "./color.js";
export * from "./convert.js";
export * from "./series.js";
export * from "./graph.js";
export {
	emit,
	emitCss,
	emitJson,
	emitMonaco,
	emitPrism,
	emitters,
	registerEmitter,
} from "./emit/index.js";
export { coverage, coverComponent, coverComponents } from "./coverage.js";
export {
	THEME_FILE_FORMAT,
	THEME_FILE_VERSION,
	THEME_FILE_SCHEMA_URL,
	buildThemeFile,
	serializeThemeFile,
	isThemeFile,
	parseThemeFile,
	type ThemeFileMeta,
	type ThemeRecipe,
	type XojiThemeFile,
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
	makeXojiAlgorithm,
	makeXojiPipelineAlgorithm,
	runPipeline,
	settlePass,
	registerToNodes,
	resolveBaseInputs,
	buildPassContext,
	DEFAULT_ANCHORS,
	SHARED_KNOBS,
	KEYWORD_DOMAINS,
	type PresetDefaults,
	type PresetAnchors,
} from "./algorithms/factory.js";
export { loadAlgorithm, loadAuthoredAlgorithm } from "./host/index.js";

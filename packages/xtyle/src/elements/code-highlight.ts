import { grammarLoaders, grammarRequires, languageAliases } from "./code-langs.generated.js";
import { customLanguages } from "./code-langs-custom.js";

interface PrismGrammar {
	[token: string]: unknown;
}

export interface PrismLike {
	languages: Record<string, PrismGrammar>;
	highlight(code: string, grammar: PrismGrammar, language: string): string;
}

/**
 * Resolve an author-supplied language id to Prism's canonical id, following the
 * alias table (`ts` → `typescript`, `html` → `markup`). A blank id, or one Prism
 * does not ship and that has not been registered, returns `null` — the caller
 * renders plain-but-themed text rather than erroring.
 */
export function resolveLanguage(lang: string | null | undefined): string | null {
	if (!lang) return null;
	const id = lang.trim().toLowerCase();
	if (!id) return null;
	const canonical = languageAliases[id] ?? id;
	if (canonical in grammarLoaders) return canonical;
	if (canonical in customGrammars) return canonical;
	if (canonical in customLanguages) return canonical;
	return null;
}

const customGrammars: Record<string, PrismGrammar> = {};

let prismPromise: Promise<PrismLike> | null = null;
const grammarPromises = new Map<string, Promise<void>>();

function loadPrism(): Promise<PrismLike> {
	if (!prismPromise) {
		prismPromise = import("prismjs").then((mod) => (mod as { default: PrismLike }).default);
	}
	return prismPromise;
}

/**
 * Load a canonical grammar and everything it requires, deepest-first. Prism's
 * grammar chunks register themselves against the shared `Prism.languages` map as a
 * side effect of import; a grammar that extends another (`tsx` → `jsx` → `javascript`
 * → `clike` → `markup`) only registers correctly once its prerequisites are present,
 * so the dependency walk runs before the target import.
 */
async function loadGrammar(canonical: string): Promise<void> {
	const prism = await loadPrism();
	const custom = customGrammars[canonical];
	if (custom) {
		prism.languages[canonical] ??= custom;
		return;
	}
	if (prism.languages[canonical]) return;
	let pending = grammarPromises.get(canonical);
	if (!pending) {
		const lang = customLanguages[canonical];
		pending = lang
			? (async () => {
					for (const dep of lang.requires) await loadGrammar(dep);
					if (lang.load) await lang.load();
					if (lang.build) prism.languages[canonical] = lang.build(prism);
				})()
			: (async () => {
					for (const dep of grammarRequires[canonical] ?? []) await loadGrammar(dep);
					const load = grammarLoaders[canonical];
					if (load) await load();
				})();
		grammarPromises.set(canonical, pending);
	}
	return pending;
}

export interface HighlightResult {
	/** The canonical language id whose grammar produced the markup, or `null` for the plain fallback. */
	language: string | null;
	/** Tokenized HTML (`.token.*` spans) when a grammar resolved; escaped plain text otherwise. */
	html: string;
}

function escapeCode(code: string): string {
	return code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Tokenize `code` for `lang`. An unresolved or unsupported language yields the
 * escaped source unchanged with `language: null`, so the caller paints it as
 * plain-but-themed text. Resolving a language warms its grammar through the one
 * shared path, then highlights — the same characters, now wrapped in `.token.*`
 * spans the `--code-*` CSS colors.
 */
export async function highlight(code: string, lang: string | null | undefined): Promise<HighlightResult> {
	const canonical = resolveLanguage(lang);
	if (!canonical) return { language: null, html: escapeCode(code) };
	await loadGrammar(canonical);
	const prism = await loadPrism();
	const grammar = prism.languages[canonical];
	if (!grammar) return { language: null, html: escapeCode(code) };
	return { language: canonical, html: prism.highlight(code, grammar, canonical) };
}

/**
 * Eagerly load the grammars for the given languages — the one warm path the
 * `preload` attribute and `XtyleCode.warm()` both feed. Unknown ids are skipped,
 * never thrown, so a typo on one block never breaks a page warm.
 */
export async function warmLanguages(langs: string[]): Promise<void> {
	const canon = new Set<string>();
	for (const lang of langs) {
		const resolved = resolveLanguage(lang);
		if (resolved) canon.add(resolved);
	}
	await Promise.all([...canon].map((id) => loadGrammar(id)));
}

export interface SupportedLanguages {
	/** Every canonical language id that resolves to a grammar, sorted — the Prism set plus the custom built-ins. */
	canonical: string[];
	/** Languages xtyle adds that Prism does not ship (e.g. `svelte`, `astro`). */
	custom: string[];
	/** Alias → canonical id (e.g. `ts` → `typescript`, `html` → `markup`). */
	aliases: Record<string, string>;
}

/**
 * The full set of languages `<xtyle-code>` can highlight: the canonical Prism ids,
 * the custom built-ins xtyle adds, and the alias table. Pure data, no grammar load —
 * the docs render this so the supported set is never out of sync with the engine.
 */
export function listLanguages(): SupportedLanguages {
	const canonical = [...new Set([...Object.keys(grammarLoaders), ...Object.keys(customLanguages)])].sort();
	return {
		canonical,
		custom: Object.keys(customLanguages).sort(),
		aliases: { ...languageAliases },
	};
}

/**
 * Register a grammar Prism does not ship. The grammar becomes resolvable by
 * `name` (and is preferred over any built-in chunk of the same id), so a custom
 * language highlights like any first-party one.
 */
export function registerLanguage(name: string, grammar: PrismGrammar): void {
	const id = name.trim().toLowerCase();
	if (!id) return;
	customGrammars[id] = grammar;
	void loadPrism().then((prism) => {
		prism.languages[id] = grammar;
	});
}

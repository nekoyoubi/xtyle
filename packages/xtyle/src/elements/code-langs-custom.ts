import type { PrismLike } from "./code-highlight.js";

type PrismGrammar = Record<string, unknown>;

/**
 * A language Prism does not ship as a canonical component. Unlike a generated
 * grammar chunk, a custom language declares its prerequisite grammars (loaded
 * deepest-first, exactly like `grammarRequires`) and then either `load`s a
 * side-effecting grammar package or `build`s its grammar against the live Prism
 * instance — both run only after the prerequisites are present.
 */
export interface CustomLanguage {
	requires: string[];
	load?: () => Promise<unknown>;
	build?: (prism: PrismLike) => PrismGrammar;
}

/**
 * Astro: a frontmatter fence (`---` … `---`, highlighted as TypeScript) over a
 * template body that is JSX in all but name — components, native tags, and
 * `attr={expr}` attributes — so the body is the `tsx` grammar rather than plain
 * `markup`, whose tag grammar cannot parse JSX-style attribute values.
 */
function buildAstro(prism: PrismLike): PrismGrammar {
	const languages = prism.languages;
	const body = (languages.tsx ?? languages.jsx ?? languages.markup ?? {}) as PrismGrammar;
	const astro: PrismGrammar = {
		frontmatter: {
			pattern: /^---[\s\S]*?\n---/,
			greedy: true,
			alias: "language-typescript",
			inside: languages.typescript ?? languages.javascript ?? {},
		},
		...body,
	};
	languages.astro = astro;
	return astro;
}

export const customLanguages: Record<string, CustomLanguage> = {
	svelte: { requires: ["markup", "javascript", "typescript"], load: () => import("prism-svelte") },
	astro: { requires: ["markup", "javascript", "typescript", "jsx", "tsx"], build: buildAstro },
};

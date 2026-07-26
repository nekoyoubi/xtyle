import {
	registerBbcodeTags as register,
	defineBbcodeVocabulary as define,
	type BbcodeTag,
} from "../markup/bbcode.js";

/**
 * The public entry point for the BBCode tag registry — and the *only* one an app should use.
 *
 * The registry is module state, and module state is per-instance. `@xtyle/core/markup` and
 * `@xtyle/core/elements` are separate entry points, and a bundler is free to give each its own copy
 * of the module behind them; when it does, tags registered through the markup entry land in a
 * registry the running elements never read. The symptom is the confusing one: the server-rendered
 * markup is right and the hydrated element paints the tag back to literal text a tick later.
 *
 * Re-exporting through the elements graph is what puts the registration and the components that read
 * it in the same instance. Same reasoning as `allowUriSchemes`, and the same rule: call it once at
 * startup, before anything paints.
 *
 * **This module is deliberately a leaf** — it pulls in the registry and nothing else. Importing the
 * `@xtyle/core/elements` barrel evaluates every custom element, which touches `HTMLElement` and so
 * throws outright in Node. Anywhere the registration has to run at build time as well as in the
 * browser — an Astro frontmatter beside a client script, an SSR entry — import
 * `@xtyle/core/elements/bbcode-registry.js` directly and it works on both sides.
 *
 * @example
 * ```ts
 * import { registerBbcodeTags, defineBbcodeVocabulary } from "@xtyle/core/elements";
 *
 * registerBbcodeTags([
 *   { name: "choice", block: true, render: (c) => `<button type="button">${c.content}</button>` },
 * ]);
 * defineBbcodeVocabulary("story", ["b", "i", "url", "quote", "choice"]);
 * defineBbcodeVocabulary("bio", ["b", "i", "url"]);
 * ```
 */
export function registerBbcodeTags(tags: readonly BbcodeTag[]): void {
	register(tags);
}

/**
 * Name a subset of the registry, so one surface can accept a tag another refuses.
 *
 * Same instance caveat as `registerBbcodeTags` above: declare vocabularies through this entry point,
 * not through `@xtyle/core/markup`.
 */
export function defineBbcodeVocabulary(name: string, tagNames: readonly string[]): void {
	define(name, tagNames);
}

export type { BbcodeTag, BbcodeTagContext } from "../markup/bbcode.js";

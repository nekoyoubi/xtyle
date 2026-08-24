/**
 * Bundler configuration for consumers, so nobody has to transcribe xtyle's dependency graph.
 *
 * Components render their chrome through a sandboxed fragment runtime, and that runtime loads a
 * WebAssembly module which the emscripten build fetches relative to its own JavaScript. Vite's
 * dependency pre-bundling rewrites that JavaScript into `node_modules/.vite/deps/` and does *not*
 * carry the wasm along, so the fetch 404s, the dev server answers with `index.html`, and
 * instantiation dies on the HTML's leading bytes. Every element then registers and paints nothing.
 *
 * Two details make it worse than an ordinary misconfiguration. Tokens still apply, so the page looks
 * correctly themed and only the content is missing, which reads as a styling problem. And it is
 * **dev-only** — a production build and preview render correctly — so the failure appears exactly
 * where authoring happens and disappears in the artifact you would check it against.
 *
 * Excluding `@xtyle/core` alone does not fix it: the runtime is reached transitively and stays
 * pre-bundled. The whole chain has to be named, which is a consumer having to know xtyle's
 * dependency graph to render a button. Spreading {@link viteExcludes} instead keeps that knowledge
 * here, where it changes when the graph does.
 *
 * The other answer needs no bundler configuration at all and covers every bundler rather than this
 * one: `setSandboxVariant` from `@xtyle/core` takes a `singlefile-*` QuickJS build, which carries
 * the wasm inline and leaves no asset to lose.
 */

/**
 * The packages Vite must not pre-bundle, in dependency order: xtyle, the xript runtime it renders
 * fragments through, and the QuickJS/emscripten chain that carries the wasm.
 *
 * ```ts
 * import { viteExcludes } from "@xtyle/core/vite";
 *
 * export default defineConfig({
 *   optimizeDeps: { exclude: [...viteExcludes] },
 * });
 * ```
 */
export const viteExcludes: readonly string[] = [
	"@xtyle/core",
	"@xriptjs/runtime",
	"quickjs-emscripten-core",
	"@jitl/quickjs-wasmfile-release-sync",
	"@jitl/quickjs-wasmfile-release-asyncify",
];

/**
 * The same list as a config fragment to merge into a Vite config, for a consumer who would rather
 * spread one object than assemble the key themselves. Merge it rather than assigning it if the app
 * excludes packages of its own.
 *
 * ```ts
 * export default defineConfig({ ...xtyleViteConfig() });
 * ```
 */
export function xtyleViteConfig(): { optimizeDeps: { exclude: string[] } } {
	return { optimizeDeps: { exclude: [...viteExcludes] } };
}

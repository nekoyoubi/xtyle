import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import { defineConfig } from "astro/config";
import { llmsTxt } from "./integrations/llms-txt.mjs";

export default defineConfig({
	site: "https://xoji.dev",
	trailingSlash: "ignore",
	server: { port: 4381, host: false },
	devToolbar: { enabled: false },
	integrations: [svelte(), sitemap(), llmsTxt()],
	vite: {
		assetsInclude: ["**/*.wasm"],
		optimizeDeps: {
			// The bench is a `client:only` island, so Vite discovers its heavy leaf deps on the
			// first browser request and re-optimizes mid-flight — a cold-start 504 storm that
			// fails the island's dynamic import until it settles. Pre-bundling them up front
			// makes a fresh dev server load the bench clean. Kept to pure leaf deps; `@xoji/core`
			// is deliberately not here (pre-bundling a workspace ESM package risks a dual-instance
			// split of its custom-element registry).
			include: ["culori", "prismjs", "prism-svelte"],
			exclude: [
				"@xriptjs/runtime",
				"quickjs-emscripten",
				"quickjs-emscripten-core",
				"@jitl/quickjs-wasmfile-release-sync",
			],
		},
		ssr: {
			external: ["@xoji/core"],
		},
	},
});

import sitemap from "@astrojs/sitemap";
import svelte from "@astrojs/svelte";
import { defineConfig } from "astro/config";
import { llmsTxt } from "./integrations/llms-txt.mjs";

export default defineConfig({
	site: "https://xtyle.dev",
	trailingSlash: "ignore",
	server: { port: 4381, host: false },
	devToolbar: { enabled: false },
	integrations: [svelte(), sitemap(), llmsTxt()],
	vite: {
		server: { strictPort: true },
		assetsInclude: ["**/*.wasm"],
		optimizeDeps: {
			// INFO: pre-bundle only leaf deps; adding @xtyle/core to include risks a dual-instance split of its custom-element registry
			include: ["culori", "prismjs", "prism-svelte"],
			exclude: [
				"@xriptjs/runtime",
				"quickjs-emscripten",
				"quickjs-emscripten-core",
				"@jitl/quickjs-wasmfile-release-sync",
			],
		},
		ssr: {
			external: ["@xtyle/core"],
		},
	},
});

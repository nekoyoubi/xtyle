import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { compile } from "svelte/compiler";

// Compiling `.svelte` here rather than through `@sveltejs/vite-plugin-svelte` keeps the harness off
// that plugin's vite 6 peer, which vitest 2 (on vite 5) does not satisfy. The wrappers are thin
// enough for it: none carries a `<style>` block, and Svelte 5 strips the `lang="ts"` annotations
// natively, so a bare `compile()` is the whole toolchain.
const sveltePlugin = {
	name: "xtyle-svelte-compile",
	enforce: "pre" as const,
	transform(code: string, id: string) {
		if (!id.endsWith(".svelte")) return null;
		const { js } = compile(code, { filename: id, generate: "client", dev: false });
		return { code: js.code, map: js.map };
	},
};

const stub = fileURLToPath(new URL("./test/stubs/element.ts", import.meta.url));

export default defineConfig({
	plugins: [sveltePlugin],
	resolve: {
		conditions: ["browser", "svelte", "import", "default"],
		alias: [{ find: /^@xtyle\/core\/elements(\/.*)?$/, replacement: stub }],
	},
	test: {
		environment: "happy-dom",
		include: ["test/**/*.test.ts"],
		setupFiles: ["./test/setup.ts"],
	},
});

import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { compile } from "svelte/compiler";

// INFO: compile .svelte here rather than via @sveltejs/vite-plugin-svelte, whose vite 6 peer vitest 2
// (on vite 5) doesn't satisfy; the wrappers carry no <style> and Svelte 5 strips lang="ts", so compile() suffices
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

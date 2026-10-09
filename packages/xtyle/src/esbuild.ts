import { existsSync } from "node:fs";
import { join } from "node:path";

/** The slice of esbuild's plugin API this plugin uses, so depending on it needs no esbuild types. */
export interface EsbuildPluginLike {
	name: string;
	setup(build: {
		onResolve(
			options: { filter: RegExp },
			callback: (args: { path: string; resolveDir: string }) => { path: string } | undefined,
		): void;
	}): void;
}

/**
 * The esbuild plugin that builds an algorithm mod the way the blessed set is built: the engine's color
 * primitives resolve to their sandbox twin, which calls the host's `cuti` binding instead of bundling a
 * color library. A mod built with it is about half the size and derives faster, with byte-identical
 * output; one built without it still works, carrying its own copy of the color math.
 *
 * ```ts
 * import { build } from "esbuild";
 * import { xtyleModPlugin } from "@xtyle/core/esbuild";
 *
 * await build({
 *   entryPoints: ["src/mod.ts"],
 *   outfile: "src/mod.js",
 *   bundle: true,
 *   format: "iife",
 *   platform: "neutral",
 *   plugins: [xtyleModPlugin()],
 * });
 * ```
 */
export function xtyleModPlugin(): EsbuildPluginLike {
	return {
		name: "xtyle-mod",
		setup(build) {
			build.onResolve({ filter: /(^|\/)color-primitives\.js$/ }, (args) => {
				for (const ext of [".js", ".ts"]) {
					const candidate = join(args.resolveDir, `color-primitives.host${ext}`);
					if (existsSync(candidate)) return { path: candidate };
				}
				return undefined;
			});
		},
	};
}

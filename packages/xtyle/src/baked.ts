import type { Algorithm } from "./types.js";

// `batteries.ts` (the baked algorithms) is bundled separately because it imports preset
// sources outside this package's rootDir; a runtime dynamic import via a computed specifier
// loads the bundled output without pulling it into the tsc program.
export async function bakedAlgorithm(id: string): Promise<Algorithm> {
	const specifier = "./batteries.js";
	const mod = (await import(specifier)) as { getAlgorithm(id: string): Algorithm };
	return mod.getAlgorithm(id);
}

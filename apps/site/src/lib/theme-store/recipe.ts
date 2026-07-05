import type { Algorithm, TokenRegister } from "@xoji/core";
import { derive } from "@xoji/core";
import { hostedAlgorithm } from "@xoji/core/algorithms";
import type { BenchState } from "../../components/bench/state.js";
import { anchorsToConstraints, defaultState, toDeriveKnobs } from "../../components/bench/state.js";
import type { ThemeRecipe } from "./types.js";

export { defaultState };

export function normalizeRecipe(partial: unknown): ThemeRecipe {
	const base = defaultState();
	if (!partial || typeof partial !== "object") return base;
	const p = partial as Partial<BenchState> & { pins?: TokenRegister };
	const rawOverrides = p.overrides ?? p.pins;
	const recipe: ThemeRecipe = {
		algorithm: typeof p.algorithm === "string" ? p.algorithm : base.algorithm,
		anchors: { ...base.anchors, ...(p.anchors ?? {}) },
		knobs: { ...base.knobs, ...(p.knobs ?? {}) },
		overrides:
			rawOverrides && typeof rawOverrides === "object"
				? ({ ...rawOverrides } as TokenRegister)
				: {},
	};
	if (typeof p.customSpec === "string") recipe.customSpec = p.customSpec;
	if (typeof p.customCode === "string") recipe.customCode = p.customCode;
	return recipe;
}

export function recipesEqual(a: ThemeRecipe, b: ThemeRecipe): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

export interface DeriveRegisterResult {
	register: TokenRegister;
	error: string | null;
}

export function deriveRegister(
	recipe: ThemeRecipe,
	algos?: Map<string, Algorithm> | null,
): DeriveRegisterResult {
	let algorithm: Algorithm;
	try {
		algorithm =
			algos?.get(recipe.algorithm) ?? hostedAlgorithm(recipe.algorithm);
	} catch {
		algorithm = hostedAlgorithm("xoji-default");
	}
	try {
		const register = derive(algorithm, {
			knobs: toDeriveKnobs(recipe.knobs),
			constraints: { ...anchorsToConstraints(recipe.anchors), ...recipe.overrides },
		});
		return { register, error: null };
	} catch (e) {
		return { register: {}, error: (e as Error).message };
	}
}

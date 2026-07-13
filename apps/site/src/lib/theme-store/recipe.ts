import type { Algorithm, TokenRegister } from "@xtyle/core";
import { derive } from "@xtyle/core";
import { hostedAlgorithm } from "@xtyle/core/algorithms";
import type { BenchState } from "../../components/bench/state.js";
import {
	anchorsToConstraints,
	defaultState,
	retireAlgorithm,
	toDeriveKnobs,
} from "../../components/bench/state.js";
import type { ThemeRecipe } from "./types.js";

export { defaultState };

export function normalizeRecipe(partial: unknown): ThemeRecipe {
	const base = defaultState();
	if (!partial || typeof partial !== "object") return base;
	const p = partial as Partial<BenchState> & { pins?: TokenRegister };
	const rawOverrides = p.overrides ?? p.pins;
	const retired = retireAlgorithm(
		typeof p.algorithm === "string" ? p.algorithm : base.algorithm,
		{ ...base.knobs, ...(p.knobs ?? {}) },
	);
	const recipe: ThemeRecipe = {
		algorithm: retired.algorithm,
		anchors: { ...base.anchors, ...(p.anchors ?? {}) },
		knobs: retired.knobs,
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
		algorithm = hostedAlgorithm("xtyle-default");
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

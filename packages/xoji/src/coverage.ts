import type { CoverageResult, TokenName, TokenRegister } from "./types.js";
import type { ComponentManifest } from "./manifest/types.js";
import { getComponent, listComponents } from "./manifest/registry.js";

export function coverage(consumed: TokenName[], produced: TokenRegister): CoverageResult;
export function coverage(args: { consumed: TokenName[]; produced: TokenRegister }): CoverageResult;
export function coverage(
	consumedOrArgs: TokenName[] | { consumed: TokenName[]; produced: TokenRegister },
	produced?: TokenRegister,
): CoverageResult {
	const consumed = Array.isArray(consumedOrArgs) ? consumedOrArgs : consumedOrArgs.consumed;
	const register = Array.isArray(consumedOrArgs) ? (produced as TokenRegister) : consumedOrArgs.produced;
	const have = new Set(Object.keys(register).map(normalize));
	const missing = consumed.map(normalize).filter((name) => !have.has(name));
	return { covered: missing.length === 0, missing };
}

export function coverComponent(
	manifest: ComponentManifest,
	produced: TokenRegister,
): CoverageResult {
	return coverage(manifest.consumedTokens, produced);
}

type ComponentRef = ComponentManifest | string;
type ComponentCoverage = { id: string; covered: boolean; missing: string[] };

function resolveComponent(ref: ComponentRef): ComponentManifest {
	if (typeof ref !== "string") return ref;
	const manifest = getComponent(ref);
	if (!manifest) throw new Error(`coverComponents: unknown component id "${ref}"`);
	return manifest;
}

export function coverComponents(produced: TokenRegister, subset?: ComponentRef[]): ComponentCoverage[];
export function coverComponents(
	components: ComponentRef[],
	opts: { produced: TokenRegister },
): ComponentCoverage[];
export function coverComponents(
	producedOrComponents: TokenRegister | ComponentRef[],
	subsetOrOpts?: ComponentRef[] | { produced: TokenRegister },
): ComponentCoverage[] {
	const componentsFirst = Array.isArray(producedOrComponents);
	const produced = componentsFirst
		? (subsetOrOpts as { produced: TokenRegister }).produced
		: producedOrComponents;
	const refs = componentsFirst
		? producedOrComponents
		: (subsetOrOpts as ComponentRef[] | undefined);
	const manifests = refs ? refs.map(resolveComponent) : listComponents();
	return manifests.map((manifest) => {
		const result = coverComponent(manifest, produced);
		return { id: manifest.id, covered: result.covered, missing: result.missing };
	});
}

function normalize(name: TokenName): TokenName {
	return name.startsWith("--") ? name : `--${name}`;
}

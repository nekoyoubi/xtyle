import type { TokenName, TokenRegister } from "./types.js";

export interface TokenNode {
	name: TokenName;
	value?: string;
	refs?: TokenName[];
	resolve?: (inputs: TokenRegister) => string;
}

export class CycleError extends Error {
	constructor(public readonly cycle: TokenName[]) {
		super(`xtyle: cycle detected in token graph: ${cycle.join(" -> ")}`);
		this.name = "CycleError";
	}
}

/**
 * Resolves a token graph to a register. Values are computed in topological order
 * — a node's `refs` are resolved before its own `resolve` runs, so every closure
 * sees its inputs already materialized — while the returned register preserves the
 * node declaration order, so output key order is stable and independent of the
 * dependency edges. Throws {@link CycleError} on a cyclic `refs` chain.
 */
export function resolveGraph(nodes: TokenNode[]): TokenRegister {
	const byName = new Map<TokenName, TokenNode>();
	for (const node of nodes) byName.set(node.name, node);

	const computed = new Map<TokenName, string>();
	const visiting = new Set<TokenName>();
	const done = new Set<TokenName>();
	const stack: TokenName[] = [];

	const visit = (name: TokenName): void => {
		if (done.has(name)) return;
		const node = byName.get(name);
		if (!node) return;
		if (visiting.has(name)) {
			const start = stack.indexOf(name);
			throw new CycleError([...stack.slice(start), name]);
		}
		visiting.add(name);
		stack.push(name);
		for (const ref of node.refs ?? []) visit(ref);
		if (node.resolve) {
			const inputs: TokenRegister = {};
			for (const [key, value] of computed) inputs[key] = value;
			computed.set(name, node.resolve(inputs));
		} else if (node.value !== undefined) {
			computed.set(name, node.value);
		}
		stack.pop();
		visiting.delete(name);
		done.add(name);
	};

	for (const node of nodes) visit(node.name);

	const resolved: TokenRegister = {};
	for (const node of nodes) {
		const value = computed.get(node.name);
		if (value !== undefined) resolved[node.name] = value;
	}
	return resolved;
}

export function applyConstraints(
	register: TokenRegister,
	constraints: TokenRegister | undefined,
): TokenRegister {
	if (!constraints) return { ...register };
	return { ...register, ...constraints };
}

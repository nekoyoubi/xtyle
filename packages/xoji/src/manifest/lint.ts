import type { ComponentManifest } from "./types.js";

export function tokensInCss(css: string): Set<string> {
	const found = new Set<string>();
	const pattern = /var\(\s*(--[a-z0-9-]+)/gi;
	let match: RegExpExecArray | null;
	while ((match = pattern.exec(css)) !== null) {
		const token = match[1];
		if (token) found.add(token);
	}
	return found;
}

export function styleQueriedTokensInCss(css: string): Set<string> {
	const found = new Set<string>();
	const pattern = /style\(\s*(--[a-z0-9-]+)\s*:/gi;
	let match: RegExpExecArray | null;
	while ((match = pattern.exec(css)) !== null) {
		const token = match[1];
		if (token) found.add(token);
	}
	return found;
}

export function declaredPropsInCss(css: string): Set<string> {
	const queried = styleQueriedTokensInCss(css);
	const found = new Set<string>();
	const pattern = /(--[a-z0-9-]+)\s*:/gi;
	let match: RegExpExecArray | null;
	while ((match = pattern.exec(css)) !== null) {
		const prop = match[1];
		if (prop && !queried.has(prop)) found.add(prop);
	}
	return found;
}

export function consumedTokensInCss(css: string): Set<string> {
	const declared = declaredPropsInCss(css);
	const consumed = new Set<string>(styleQueriedTokensInCss(css));
	for (const token of tokensInCss(css)) {
		if (!declared.has(token)) consumed.add(token);
	}
	return consumed;
}

export function styleQueryPairsInCss(css: string): Array<{ token: string; value: string }> {
	const pairs: Array<{ token: string; value: string }> = [];
	const pattern = /style\(\s*(--[a-z0-9-]+)\s*:\s*([a-z0-9-]+)\s*\)/gi;
	let match: RegExpExecArray | null;
	while ((match = pattern.exec(css)) !== null) {
		const token = match[1];
		const value = match[2];
		if (token && value) pairs.push({ token, value });
	}
	return pairs;
}

/**
 * The consume side of the keyword-domain contract: every `@container style(--token: value)`
 * branch in a component's CSS must query a value inside that token's declared domain. An
 * out-of-domain or misspelled keyword silently never matches at runtime (the cue just never
 * appears), so this catches it at build instead. Only tokens with a declared domain are checked;
 * the domain registry is the source of truth, passed in so this module stays free of any
 * algorithm import (the produce side enforces the same domains in the gauntlet).
 */
export function lintStyleQueryDomains(
	css: string,
	domains: Record<string, readonly string[]>,
): { ok: boolean; invalid: Array<{ token: string; value: string }> } {
	const invalid = styleQueryPairsInCss(css).filter(({ token, value }) => {
		const domain = domains[token];
		return domain !== undefined && !domain.includes(value);
	});
	return { ok: invalid.length === 0, invalid };
}

/**
 * The host-control side of the fragment contract: every interactive control a fill declares in
 * `hostControls` must actually ship its `marker` attribute in the scaffold, or the element wires
 * a button that does not exist (a silent dead control). A marker counts only as a standalone
 * attribute: `data-copy` in `data-copy-label` does not satisfy a `data-copy` declaration.
 */
export function lintHostControls(
	markers: readonly string[],
	scaffoldHtml: string,
): { ok: boolean; missing: string[] } {
	const missing = markers
		.filter((marker) => !new RegExp(`\\b${marker}(?=[\\s=>])`).test(scaffoldHtml))
		.sort();
	return { ok: missing.length === 0, missing };
}

export function lintManifest(
	manifest: ComponentManifest,
	css: string,
): { ok: boolean; undeclared: string[]; unused: string[] } {
	const inCss = consumedTokensInCss(css);
	const declared = new Set(manifest.consumedTokens);
	const undeclared = [...inCss].filter((token) => !declared.has(token)).sort();
	const unused = [...declared].filter((token) => !inCss.has(token)).sort();
	return { ok: undeclared.length === 0 && unused.length === 0, undeclared, unused };
}

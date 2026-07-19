import { getComponent } from "./registry.js";
import type { ComponentManifest, PropDef } from "./types.js";

/**
 * Authoring diagnostics for the framework bindings.
 *
 * A wrong prop name and an out-of-vocabulary token both degrade to "render something plausible"
 * rather than to an error: the wrappers spread surplus keys onto the element, where an unrecognized
 * name is inert and a valid HTML global like `title` lands somewhere real and becomes a tooltip. The
 * result looks deliberate, so the mistake survives review and ships. Every check here is derived from
 * the component manifest, so a component that grows a prop or a slot is covered without a second edit.
 */

const HTML_GLOBALS = new Set([
	"accesskey",
	"autocapitalize",
	"autofocus",
	"class",
	"contenteditable",
	"dir",
	"draggable",
	"enterkeyhint",
	"hidden",
	"id",
	"inert",
	"inputmode",
	"is",
	"itemid",
	"itemprop",
	"itemref",
	"itemscope",
	"itemtype",
	"lang",
	"nonce",
	"part",
	"popover",
	"role",
	"slot",
	"spellcheck",
	"style",
	"tabindex",
	"title",
	"translate",
]);

function isPassthrough(key: string): boolean {
	const lower = key.toLowerCase();
	return (
		HTML_GLOBALS.has(lower) ||
		lower.startsWith("data-") ||
		lower.startsWith("aria-") ||
		lower.startsWith("on") ||
		lower.startsWith("client:") ||
		lower.startsWith("set:")
	);
}

function editDistance(a: string, b: string): number {
	const rows = a.length + 1;
	const cols = b.length + 1;
	let prev = Array.from({ length: cols }, (_, i) => i);
	for (let i = 1; i < rows; i++) {
		const curr = [i];
		for (let j = 1; j < cols; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			curr[j] = Math.min((prev[j] as number) + 1, (curr[j - 1] as number) + 1, (prev[j - 1] as number) + cost);
		}
		prev = curr;
	}
	return prev[cols - 1] as number;
}

function nearest(key: string, candidates: readonly string[]): string | null {
	let best: string | null = null;
	let bestScore = Infinity;
	for (const candidate of candidates) {
		const score = editDistance(key.toLowerCase(), candidate.toLowerCase());
		const tolerance = Math.max(2, Math.ceil(Math.max(key.length, candidate.length) / 3));
		if (score < bestScore && score <= tolerance) {
			bestScore = score;
			best = candidate;
		}
	}
	return best;
}

/**
 * Whether a prop's `options` are the whole vocabulary or just the named members of an open one.
 * `Icon`'s `name` lists every library glyph but is typed `IconName | string`, because a generated-mark
 * spec carrying the `--` grammar is equally valid — so enforcing its list would warn on correct code,
 * and a diagnostic that cries wolf gets ignored, taking the true positives down with it.
 */
function isClosedSet(prop: PropDef): boolean {
	return !/(^|\|)\s*string\s*(\||$)/.test(prop.type);
}

function slotHint(manifest: ComponentManifest, key: string, slot: string): string {
	const projection =
		slot === "default"
			? "Put it in the component's body instead."
			: `Project it as content instead — \`<Fragment slot="${slot}">…</Fragment>\` in Astro, ` +
				`\`{#snippet ${slot}()}…{/snippet}\` in Svelte, or \`<span slot="${slot}">…</span>\` in plain HTML.`;
	const subject = key === slot ? `\`${key}\` on <${manifest.name}> is a slot, not a prop` : `<${manifest.name}> has no \`${key}\` prop — that content is the \`${slot}\` slot`;
	return `xtyle: ${subject}, so the value was dropped. ${projection}`;
}

/**
 * Check one component invocation against its manifest and return the problems found, most specific
 * first. Pure and synchronous so it is testable on its own; `warnAuthoring` is the side-effecting
 * wrapper the bindings actually call.
 */
export function diagnoseAuthoring(componentId: string, props: Record<string, unknown>): string[] {
	const manifest = getComponent(componentId);
	if (!manifest) return [];

	const propNames = manifest.props.map((p) => p.name);
	const propByName = new Map(manifest.props.map((p) => [p.name.toLowerCase(), p]));
	const slotNames = new Set(manifest.slots.map((s) => s.name.toLowerCase()));
	const aliasTargets = new Map<string, string>();
	for (const prop of manifest.props) {
		for (const alias of prop.aliases ?? []) aliasTargets.set(alias.toLowerCase(), prop.name);
	}
	const slotAliases = new Map<string, string>();
	for (const slot of manifest.slots) {
		for (const alias of slot.aliases ?? []) slotAliases.set(alias.toLowerCase(), slot.name);
	}

	const supplied = new Set(Object.keys(props).map((k) => k.toLowerCase()));
	const problems: string[] = [];

	for (const [key, value] of Object.entries(props)) {
		if (value === undefined) continue;
		const lower = key.toLowerCase();

		if (slotNames.has(lower) && !propByName.has(lower)) {
			problems.push(slotHint(manifest, key, lower));
			continue;
		}

		const aliasedSlot = slotAliases.get(lower);
		if (aliasedSlot !== undefined && !propByName.has(lower)) {
			problems.push(slotHint(manifest, key, aliasedSlot));
			continue;
		}

		const aliased = aliasTargets.get(lower);
		if (aliased !== undefined && !supplied.has(aliased.toLowerCase())) {
			problems.push(
				`xtyle: <${manifest.name}> received \`${key}\` but no \`${aliased}\`. ` +
					`\`${aliased}\` is the prop that renders; \`${key}\` is not, so nothing was drawn from it.`,
			);
			continue;
		}

		const prop = propByName.get(lower);
		if (prop) {
			if (prop.options && isClosedSet(prop) && typeof value === "string" && !prop.options.includes(value)) {
				const suggestion = nearest(value, prop.options);
				problems.push(
					`xtyle: "${value}" is not a valid \`${prop.name}\` on <${manifest.name}>` +
						(suggestion ? `; did you mean "${suggestion}"?` : ".") +
						` Valid values are ${prop.options.join(", ")}.`,
				);
			}
			continue;
		}

		if (isPassthrough(key)) continue;

		const suggestion = nearest(key, propNames);
		problems.push(
			`xtyle: \`${key}\` is not a prop on <${manifest.name}>` +
				(suggestion ? `; did you mean \`${suggestion}\`?` : ".") +
				" It was passed through to the element as an attribute and has no effect.",
		);
	}

	return problems;
}

/** The binding-facing entry point: diagnose, and surface anything found on the console. */
export function warnAuthoring(componentId: string, props: Record<string, unknown>): void {
	if (typeof console === "undefined") return;
	for (const problem of diagnoseAuthoring(componentId, props)) console.warn(problem);
}

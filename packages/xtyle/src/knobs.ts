import type { Algorithm, KnobSpec, Knobs } from "./types.js";

/**
 * Check a caller's knobs against the domain the algorithm declares, and coerce each value to the
 * kind that domain states.
 *
 * Every knob reader in the derivation falls back silently on a value it does not recognize — an
 * unknown `accentStrategy` resolves to the preset's own posture rather than failing — which is right
 * for the *derivation* (a theme must always come out) and catastrophic for an *input surface*. Left
 * unchecked, `--knob accentStrategy=duoo` exits 0 and emits a theme that is not the one asked for: a
 * typo becomes a silently different design. The bench never had this problem, because its controls are
 * built *from* the domain and cannot express a value outside it. A headless caller hands over a raw
 * envelope, so the domain has to be enforced here instead.
 *
 * Coercion is driven by the declared `kind` rather than inferred from the value's shape, because
 * shape-guessing is wrong in both directions: a `text` knob set to `"12"` is the *string* `"12"`, and
 * a `select` set to `"false"` is the *string* `"false"`, not a number and not a boolean.
 *
 * Throws on the first offending knob. The caller (CLI, MCP tool) surfaces the message; the point is
 * that a bad knob is loud rather than quietly absorbed.
 */
export function validateKnobs(algorithm: Algorithm, raw: Record<string, unknown>): Knobs {
	const specs = new Map(algorithm.knobSpecs.map((spec) => [spec.name, spec]));
	const out: Knobs = {};

	for (const [name, value] of Object.entries(raw)) {
		if (value === undefined) continue;

		if (!algorithm.knobs.includes(name)) {
			throw new Error(`xtyle: "${algorithm.id}" has no knob "${name}" (has: ${algorithm.knobs.join(", ")})`);
		}

		const spec = specs.get(name);
		// A knob with no scalar domain is a composite group the consumer assembles itself (font stacks,
		// anchor pickers). Its value is a structured object, so there is nothing here to coerce or bound.
		if (!spec || spec.kind === "composite") {
			out[name] = value;
			continue;
		}

		out[name] = coerce(spec, value, algorithm.id);
	}

	return out;
}

function coerce(spec: KnobSpec, value: unknown, algorithmId: string): string | number {
	const where = `"${algorithmId}" knob "${spec.name}"`;

	if (spec.kind === "range") {
		const n = typeof value === "number" ? value : Number(String(value).trim());
		if (!Number.isFinite(n)) {
			throw new Error(`xtyle: ${where} takes a number, got "${String(value)}"`);
		}
		const { min, max } = spec;
		if ((min !== undefined && n < min) || (max !== undefined && n > max)) {
			throw new Error(`xtyle: ${where} takes ${min ?? "-∞"}..${max ?? "∞"}, got ${n}`);
		}
		return n;
	}

	if (spec.kind === "select") {
		const s = String(value);
		const accepted = (spec.options ?? []).map((o) => o.value);
		if (accepted.length && !accepted.includes(s)) {
			throw new Error(`xtyle: ${where} takes ${accepted.join(" | ")}, got "${s}"`);
		}
		return s;
	}

	return String(value);
}

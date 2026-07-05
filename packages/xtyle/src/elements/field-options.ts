export type FieldOption = { value: string; label?: string };

/** Coerce the public `options` input into a clean `{ value, label? }[]`. Accepts a `string[]`, a
 * `{ value, label }[]`, or a JSON-encoded array (the declarative `options` attribute the Astro binding
 * sets). Anything unparseable or non-array yields an empty list, and malformed entries are skipped. */
export function normalizeFieldOptions(raw: unknown): FieldOption[] {
	let source = raw;
	if (typeof source === "string") {
		const trimmed = source.trim();
		if (trimmed.length === 0) return [];
		try {
			source = JSON.parse(trimmed);
		} catch {
			return [];
		}
	}
	if (!Array.isArray(source)) return [];
	const out: FieldOption[] = [];
	for (const entry of source) {
		if (typeof entry === "string") {
			out.push({ value: entry });
		} else if (entry && typeof (entry as FieldOption).value === "string") {
			const e = entry as FieldOption;
			out.push(typeof e.label === "string" ? { value: e.value, label: e.label } : { value: e.value });
		}
	}
	return out;
}

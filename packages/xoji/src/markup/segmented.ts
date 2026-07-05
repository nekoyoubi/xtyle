export interface Segment {
	value: string;
	label: string;
	/** Renders the segment non-selectable (skipped by pointer and keyboard), for a choice the current data can't offer. */
	disabled?: boolean;
	/** Trailing text after the label (a count or status), shown inside the segment. */
	badge?: string;
	/** Project a live light-DOM child through this named `<slot>` instead of rendering `label` as text —
	 * the rich-content mode where a segment holds an icon or other framework-owned markup. The element
	 * sets it for `[slot="segment"]` children; the `options` shorthand never carries it. */
	slot?: string;
}

/** The host-layout rule for a segmented control: the one `:host` rule, shared by the element's scaffold and the SSR declarative shadow root. */
export const segmentedHostCss = ":host { display: inline-block; }";

/** Parse `options` (label:value pairs or bare labels, comma-separated) into segments. */
export function parseSegments(raw: string): Segment[] {
	return raw
		.split(",")
		.map((part) => part.trim())
		.filter(Boolean)
		.map((part) => {
			const sep = part.indexOf(":");
			if (sep === -1) return { value: part, label: part };
			return { value: part.slice(sep + 1).trim(), label: part.slice(0, sep).trim() };
		});
}

export type SegmentInput = string | ReadonlyArray<string | Segment>;

/** Coerce the public `options` input into segments. Accepts the comma-string shorthand (`a,b:2`), a
 * structured `{ value, label }[]` (or bare `string[]`), or a JSON-encoded array (the declarative
 * attribute the Astro binding sets for the structured form). A missing `label` falls back to the value. */
export function normalizeSegments(raw: unknown): Segment[] {
	if (raw == null) return [];
	if (typeof raw === "string") {
		const trimmed = raw.trim();
		if (trimmed.startsWith("[")) {
			try {
				return normalizeSegments(JSON.parse(trimmed));
			} catch {
				return parseSegments(raw);
			}
		}
		return parseSegments(raw);
	}
	if (!Array.isArray(raw)) return [];
	const out: Segment[] = [];
	for (const entry of raw) {
		if (typeof entry === "string") {
			out.push({ value: entry, label: entry });
		} else if (entry && typeof (entry as Segment).value === "string") {
			const e = entry as Segment;
			const seg: Segment = { value: e.value, label: typeof e.label === "string" ? e.label : e.value };
			if (e.disabled) seg.disabled = true;
			if (typeof e.badge === "string") seg.badge = e.badge;
			out.push(seg);
		}
	}
	return out;
}

/** Resolve the selected value the same way the element's `get value()` does: an explicit enabled value, else the first enabled segment. */
export function selectedValue(segments: Segment[], value: string | null | undefined): string {
	if (value != null && segments.some((s) => s.value === value && !s.disabled)) return value;
	return (segments.find((s) => !s.disabled) ?? segments[0])?.value ?? "";
}

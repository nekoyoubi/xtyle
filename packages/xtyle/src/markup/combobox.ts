import type { FieldOption } from "../elements/field-options.js";

/**
 * How the typed query narrows the option list.
 * `contains` (the default) matches anywhere in the label or the value, `starts` matches a prefix,
 * and `none` shows the list untouched — the async / server-filtered path, where the consumer replaces
 * `options` on every `input` and the component must not filter a second time.
 */
export type ComboboxFilter = "contains" | "starts" | "none";

/** The text an option presents: its label, or its value when it carries none. */
export function optionLabel(option: FieldOption): string {
	return option.label && option.label.length > 0 ? option.label : option.value;
}

/**
 * Narrow an option list by a typed query, matching case-insensitively against both the label and the
 * value (a user typing `london` finds `{ value: "Europe/London" }`). An empty query never filters, so
 * opening the list with nothing typed shows everything.
 */
export function filterOptions(
	options: readonly FieldOption[],
	query: string,
	mode: ComboboxFilter = "contains",
): FieldOption[] {
	const needle = query.trim().toLowerCase();
	if (mode === "none" || needle.length === 0) return [...options];
	const hit = (haystack: string): boolean => {
		const text = haystack.toLowerCase();
		return mode === "starts" ? text.startsWith(needle) : text.includes(needle);
	};
	return options.filter((option) => hit(option.value) || hit(optionLabel(option)));
}

/** The host-layout rule for a combobox — a block-level form control, like Field. */
export const comboboxHostCss = ":host { display: block; }";

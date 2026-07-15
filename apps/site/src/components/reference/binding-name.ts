/**
 * The identifier a consumer actually imports for a component — `date-picker` → `DatePicker`.
 *
 * A manifest's `name` is a *display* name: it titles the page, the breadcrumb, the nav, the card. It reads
 * as words ("Split Button"), which is exactly what makes it wrong as the label beside a code sample, where
 * the thing being named is the symbol you type. Derive that from the id instead of leaning on the display
 * name, which drifts the moment a name is written for humans.
 */
export function bindingName(id: string): string {
	return id
		.split("-")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join("");
}

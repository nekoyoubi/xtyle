/** Native input attributes a consumer sets for form hygiene (spell-check, IME, autofill, mobile keyboard
 * hints). They have to be forwarded from the host to the inner `<input>` / `<textarea>` because the
 * styled control lives in the component's own root, out of the consumer's reach. */
export const NATIVE_INPUT_ATTRS = [
	"spellcheck",
	"inputmode",
	"autocomplete",
	"autocapitalize",
	"autocorrect",
	"enterkeyhint",
] as const;

/** Mirror the allow-listed native attributes from the host onto the inner control, clearing any that
 * the host no longer carries so a removed attribute doesn't linger. */
export function forwardNativeInputAttrs(host: Element, target: Element): void {
	for (const attr of NATIVE_INPUT_ATTRS) {
		const value = host.getAttribute(attr);
		if (value === null) target.removeAttribute(attr);
		else target.setAttribute(attr, value);
	}
}

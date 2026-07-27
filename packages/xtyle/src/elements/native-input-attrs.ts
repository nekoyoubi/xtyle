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

/** What a component wants an attribute to be when the consumer hasn't said. */
export type NativeInputDefaults = Partial<Record<(typeof NATIVE_INPUT_ATTRS)[number], string>>;

/**
 * Mirror the allow-listed native attributes from the host onto the inner control, clearing any that
 * the host no longer carries so a removed attribute doesn't linger.
 *
 * `defaults` is what a component believes about its own control before the consumer weighs in — a
 * command palette's search box has no business being spell-checked or autofilled, and that opinion
 * should survive a consumer who never mentions either. Without this seam the clearing pass is the
 * bug: forwarding an unset attribute *removes* it, so a component with sensible defaults baked into
 * its scaffold would have them stripped the moment it started forwarding at all. The consumer still
 * wins wherever they do say something.
 */
export function forwardNativeInputAttrs(host: Element, target: Element, defaults: NativeInputDefaults = {}): void {
	for (const attr of NATIVE_INPUT_ATTRS) {
		const value = host.getAttribute(attr) ?? defaults[attr] ?? null;
		if (value === null) target.removeAttribute(attr);
		else target.setAttribute(attr, value);
	}
}

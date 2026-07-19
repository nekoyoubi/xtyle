/**
 * Escaping for fragment mods, which build markup as template-literal strings and so escape nothing
 * for free.
 *
 * **Escaping is not validation, and both are applied.** Two different things can be wrong with an
 * author value, and each layer answers only one of them:
 *
 * - *Can it break out of the markup?* → escaping, here, at the point of output.
 * - *Does it mean anything?* → validation, at the element, via `resolveTone` / `resolveVocab`.
 *
 * A value interpolated into a **class name** — a tone, a size, a variant, a sentiment — is narrowed
 * to its vocabulary by the element before it ever arrives, because an unrecognized one matches no CSS
 * rule and renders the component with no chrome at all: a plausible-looking, entirely unstyled box
 * that escaping would leave exactly as broken. Those values are *also* escaped here, and the
 * redundancy is deliberate: a fill can be driven by a host that is not the element, and a no-op on a
 * validated token is a cheap price for that never mattering.
 *
 * So do not read `escapeAttr(x)` at a call site as evidence that `x` is a meaningful value. It says
 * only that `x` cannot escape its quotes. If `x` lands in a class name, an id, or anywhere else
 * structural, it wants a vocabulary in `vocab.ts` as well.
 */

const AMP = /&/g;
const LT = /</g;
const GT = />/g;
const DQUOTE = /"/g;
const SQUOTE = /'/g;

/**
 * Escape a value for interpolation into an HTML text node. Fragment mods build their markup as
 * template-literal strings, which escape nothing for free, so every author-controlled value has to
 * pass through here or a `<` in a label becomes markup.
 */
export function escapeHtml(value: string): string {
	return value.replace(AMP, "&amp;").replace(LT, "&lt;").replace(GT, "&gt;");
}

/**
 * Escape a value for interpolation into a double-quoted attribute value. A superset of the text-node
 * form: it also covers both quote characters, so the value cannot terminate the attribute and open a
 * new one. Single quotes are escaped even though the generated markup quotes attributes with `"`,
 * which keeps a future single-quoted attribute safe rather than silently unprotected.
 */
export function escapeAttr(value: string): string {
	return escapeHtml(value).replace(DQUOTE, "&quot;").replace(SQUOTE, "&#39;");
}

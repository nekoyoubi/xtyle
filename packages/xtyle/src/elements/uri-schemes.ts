import componentHost from "./fragments/component-host.json" with { type: "json" };
import { parseSchemeList, registerUriSchemes } from "../markup/uri.js";
import { componentRuntimeStarted } from "./fragment-host.js";

/** Schemes no allowlist may name. xript refuses them at profile resolution, so accepting one here
 * would only defer the failure to the first paint, with a worse message. */
const PROHIBITED = new Set(["javascript", "vbscript"]);

/** A well-formed scheme name: a lowercase name, no colon. */
const SCHEME_NAME = /^[a-z][a-z0-9+.-]*$/;

interface FormatDecl {
	schemes?: string[];
}

const declaredFormats = (componentHost as { formats?: Record<string, FormatDecl> }).formats ?? {};

/** What an app has added, for `allowedUriSchemes` to report back. */
const added = new Set<string>();

/**
 * Allow xtyle to render URLs naming schemes beyond the built-in `http` / `https` / `mailto` / `tel` /
 * `data` — the protocols a host app serves and a library cannot know about: `asset:` and `tauri:` in
 * a Tauri window, a custom scheme in an embedded view.
 *
 * ```ts
 * import { allowUriSchemes } from "@xtyle/core/elements";
 *
 * allowUriSchemes("asset", "tauri");
 * ```
 *
 * **Call it once, at startup, before anything paints.** There are two allowlists between a URL and
 * the DOM — the markup renderers', and the one the fragment format declares — and the second is
 * host code that runs last and drops a refused URL silently. This widens both, which is the entire
 * reason it exists as one call rather than an option on each renderer: widening one alone yields a
 * URL that renders and then quietly loses its attribute, which is the shape of a defect that already
 * shipped once.
 *
 * Nothing is on the list that an app did not put there. xtyle adds no scheme on a framework's behalf,
 * because a hole nobody asked for is the worst kind — so a Tauri app naming `asset:` is opting *its
 * own* app in, and every other app is unaffected.
 *
 * A scheme is only as safe as what the host does with it: naming one says any markdown, any theme,
 * any fill xtyle renders may point a link or an image there. `javascript:` and `vbscript:` are
 * refused outright and cannot be named.
 *
 * The build-time renderer shares this runtime, so an Astro project widens it the same way — from a
 * module that runs before the first component renders, not from a page.
 *
 * @throws if a name is malformed or prohibited, or if the component runtime has already started —
 * a late call would widen the renderer while the fragment format kept the old set, and silently
 * half-applying a security decision is worse than refusing it.
 */
export function allowUriSchemes(...schemes: readonly string[]): void {
	const names = parseSchemeList(schemes);
	for (const name of names) {
		if (PROHIBITED.has(name)) {
			throw new Error(`xtyle: the "${name}:" scheme cannot be allow-listed; it is an XSS sink in every context`);
		}
		if (!SCHEME_NAME.test(name)) {
			throw new Error(`xtyle: "${name}" is not a scheme name; pass a bare lowercase name such as "asset"`);
		}
	}
	if (!names.length) return;
	if (componentRuntimeStarted()) {
		throw new Error(
			`xtyle: allowUriSchemes(${names.join(", ")}) ran after the component runtime started. ` +
				`The fragment format's allowlist is fixed once the runtime reads it, so call this at startup, before the first component paints.`,
		);
	}
	for (const format of Object.values(declaredFormats)) {
		format.schemes = [...new Set([...(format.schemes ?? []), ...names])];
	}
	registerUriSchemes(names);
	for (const name of names) added.add(name);
}

/** The schemes an app has added on top of the built-ins. */
export function allowedUriSchemes(): string[] {
	return [...added].sort();
}

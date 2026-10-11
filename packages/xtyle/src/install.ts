import { xtyleDefault } from "@xtyle/core/algorithms";
import { componentStyleSheet, componentsCss } from "./css/index.js";
import { derive } from "./index.js";
import { apply } from "./dom.js";
import { effectsCss } from "./effects.js";
import type { Algorithm, TokenRegister } from "./types.js";

const COMPONENTS_ID = "xtyle-components";
const EFFECTS_ID = "xtyle-effects";

export interface InstallOptions {
	/** The derivation algorithm. Defaults to `xtyleDefault`. */
	algorithm?: Algorithm;
	/** The tokens to pin, which every other token derives from. Nothing is pinned by default. */
	constraints?: Record<string, string>;
	/** Where the tokens land. Defaults to the document element. */
	target?: HTMLElement;
	/** Whether the component sheet goes in the document. Defaults on; off for a host that manages the sheet itself. */
	components?: boolean;
	/** Whether the effect layer's sheet goes in the document, which is what makes `data-fx` live. Defaults on. */
	effects?: boolean;
}

/** Which of the two document sheets {@link install} lands, for asking about one of them. */
export type InstalledSheet = "components" | "effects";

function claims(mark: HTMLElement): number {
	const held = Number(mark.dataset.claims);
	return Number.isFinite(held) && held > 0 ? held : 1;
}

function addSheet(id: string, sheet: CSSStyleSheet | null, css: () => string): void {
	const existing = document.getElementById(id);
	if (existing) {
		existing.dataset.claims = String(claims(existing) + 1);
		return;
	}
	const adopted = document.adoptedStyleSheets;
	const mark = document.createElement("style");
	mark.id = id;
	mark.dataset.claims = "1";
	if (sheet && Array.isArray(adopted) && !adopted.includes(sheet)) {
		document.adoptedStyleSheets = [...adopted, sheet];
		mark.dataset.adopted = "";
	} else {
		mark.textContent = css();
	}
	document.head.append(mark);
}

function removeSheet(id: string, sheet: CSSStyleSheet | null): void {
	const mark = document.getElementById(id);
	if (!mark) return;
	const left = claims(mark) - 1;
	if (left > 0) {
		mark.dataset.claims = String(left);
		return;
	}
	if ("adopted" in mark.dataset && sheet && Array.isArray(document.adoptedStyleSheets)) {
		document.adoptedStyleSheets = document.adoptedStyleSheets.filter((each) => each !== sheet);
	}
	mark.remove();
}

/**
 * Derives a theme, applies it, and lands the component and effect sheets in the document: the whole
 * bootstrap in one call.
 *
 * The document sheets are the half that is easy to miss. A shadow-rendering component adopts the
 * component sheet for itself, so a page with only `derive` + `apply` looks right until a light-DOM
 * component (`render: "light"` in its manifest) draws its structure with none of its rules, or a
 * `data-fx` spec does nothing. Nothing warns, because the rules are simply absent.
 *
 * Each sheet is added once however many callers install, and each call takes a claim on it that
 * {@link uninstall} releases, so two apps sharing a document do not remove each other's rules. It
 * does not define the elements: import `@xtyle/core/elements` for that.
 *
 * @returns the derived register, or `null` with no document
 */
export function install(options: InstallOptions = {}): TokenRegister | null {
	if (typeof document === "undefined") return null;
	const register = derive(options.algorithm ?? xtyleDefault, options.constraints ? { constraints: options.constraints } : undefined);
	apply(register, options.target ? { target: options.target } : undefined);
	if (options.components !== false) addSheet(COMPONENTS_ID, componentStyleSheet(), () => componentsCss);
	if (options.effects !== false) addSheet(EFFECTS_ID, null, () => effectsCss());
	return register;
}

/**
 * Releases one {@link install}'s claim on the document sheets, taking each out when its last claim
 * goes. One call per install; with nothing installed it does nothing. The tokens are `clear`'s to remove.
 */
export function uninstall(): void {
	if (typeof document === "undefined") return;
	removeSheet(COMPONENTS_ID, componentStyleSheet());
	removeSheet(EFFECTS_ID, null);
}

/** Whether either document sheet is installed, or whether the named one is. */
export function installed(sheet?: InstalledSheet): boolean {
	if (typeof document === "undefined") return false;
	const components = document.getElementById(COMPONENTS_ID) !== null;
	const effects = document.getElementById(EFFECTS_ID) !== null;
	if (sheet === "components") return components;
	if (sheet === "effects") return effects;
	return components || effects;
}

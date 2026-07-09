import { componentStyleSheet } from "../css/index.js";
import { THEME_APPLY_EVENT } from "../dom.js";

/**
 * The base every xtyle element extends — and the blessed base for consumer
 * subclasses too. The `protected` members below are the stable extension contract:
 * extend a shipped element (e.g. `XtyleButton`) to add behavior or state, or extend
 * `XtyleElement` directly for a fully custom element that still rides the shared token
 * sheet and the coverage contract. See the "Extending components" docs.
 *
 * To subclass: widen `observedAttributes` (spread `super.observedAttributes`), add
 * your getters/setters, override `template()` (and `styles()` if needed), and call
 * `render()` on the changes you care about. A subclass that consumes new theme tokens
 * still declares them in its manifest like any first-party element.
 */
/** The xript slot styling mode an element renders under. `isolated` attaches a shadow
 * root so host styles can't reach the fragment; `inherit` / `scoped` render into light DOM
 * so the shared component sheet (already global) styles them and no per-instance CSS ships. */
export type StyleMode = "inherit" | "isolated" | "scoped" | "auto";

export abstract class XtyleElement extends HTMLElement {
	/** The render root. Under `isolated` it's a real shadow root; under `inherit` / `scoped`
	 * it's the element itself (light DOM), typed as `ShadowRoot` so the shadow elements keep
	 * their shape — a light element only ever touches the shared `querySelector` / `innerHTML`
	 * / `addEventListener` surface both have. Subclasses read/write it via `template()` / `render()`. */
	protected root: ShadowRoot;

	private hydrated = false;
	private themeListener?: () => void;

	/** Which `StyleMode` this element renders under, mirroring the `style` its host slot declares
	 * in `component-host.json`. `isolated` attaches a shadow root and adopts the shared component
	 * sheet; `inherit` / `scoped` render into light DOM so the already-global sheet styles them;
	 * `auto` resolves per-instance (light when upgrading over pre-rendered structure, shadow when
	 * created bare). An element overrides this getter to pick a non-default mode. */
	protected get styleMode(): StyleMode {
		return "isolated";
	}

	constructor() {
		super();
		// `isolated` reuses a declarative shadow root the SSR binding emitted (DSD), so the
		// element upgrades in place over its server-rendered markup instead of throwing on a
		// second `attachShadow`, and falls back to attaching one when created client-side
		// (the Svelte binding, `document.createElement`). `inherit` / `scoped` render into the
		// element's own light DOM — no shadow, no boundary, the global sheet reaches in.
		// `auto` resolves per-instance: an element upgrading over pre-rendered light-DOM structure
		// (`[data-root]`, composed by the Astro SSR binding) stays light and adopts it; one created
		// bare (a framework client-render, raw markup) attaches a shadow root and projects the
		// consumer's framework-owned children via native `<slot>`. A forced mode keeps its behavior.
		// `:scope >` matters: the composed scaffold's `[data-root]` is always a direct child, while a
		// nested auto component (e.g. a `<xtyle-text>` inside a slotted panel) carries its own deeper
		// `[data-root]` — a bare `querySelector` would mistake that for this element's own scaffold.
		const mode = this.styleMode;
		const light = mode === "auto" ? this.querySelector(":scope > [data-root]") !== null : mode !== "isolated";
		this.root = light
			? (this as unknown as ShadowRoot)
			: (this.shadowRoot ?? this.attachShadow({ mode: "open" }));
	}

	/** The element's shadow markup. Required; a subclass overrides it to re-shape output. */
	protected abstract template(): string;

	/** Per-element host-layout rules only (e.g. `:host { display: ... }`). The component's visual styling comes from the shared `@xtyle/core/css` sheet. */
	protected styles(): string {
		return "";
	}

	/** Whether this element bakes colors from the live cascade (the charts, the ramps) and so must
	 * re-resolve when the applied theme changes. Elements that color purely through CSS `var()` leave
	 * this `false` (the cascade recolors them for free); a baking element overrides it to `true` to
	 * subscribe to `THEME_APPLY_EVENT` and re-render on a live theme swap. */
	protected get resolvesThemeAtRuntime(): boolean {
		return false;
	}

	connectedCallback(): void {
		// A baking element re-resolves its palette whenever a theme is applied anywhere (root or a
		// scoped subtree): it read the cascade once at mount, so without this a later theme swap — the
		// generator, the bench live preview, a runtime mode toggle — leaves it frozen on the palette it
		// first saw (stale, or black if it mounted before its scope carried the tokens).
		if (this.resolvesThemeAtRuntime && !this.themeListener && typeof document !== "undefined") {
			this.themeListener = () => {
				if (this.hydrated && this.root.firstChild) this.render();
			};
			document.addEventListener(THEME_APPLY_EVENT, this.themeListener);
		}
		// Render once on first connect — whether the shadow is empty (client-created,
		// e.g. the Svelte binding) or already holds a server-rendered declarative shadow
		// (the Astro DSD binding). For DSD this replaces the zero-JS inline shadow with
		// an identical client render that adopts the one shared `componentStyleSheet`
		// (the hybrid: inline CSS for the no-JS first paint, shared sheet once hydrated)
		// and runs the element's event wiring — so an interactive control hydrated from
		// DSD is live, not just styled.
		if (this.hydrated) return;
		this.hydrated = true;
		this.render();
	}

	disconnectedCallback(): void {
		if (this.themeListener) {
			document.removeEventListener(THEME_APPLY_EVENT, this.themeListener);
			this.themeListener = undefined;
		}
	}

	/** Paint the render root. Under `isolated`, adopt the shared component sheet and inline
	 * the host-layout `styles()` so the shadow is self-contained. Under `inherit` / `scoped`,
	 * the global sheet already styles the light DOM, so neither is written. Call after a state
	 * change to re-render. */
	protected render(): void {
		if (this.styleMode === "isolated") {
			this.adoptComponentSheet();
			this.root.innerHTML = `<style>${this.styles()}</style>${this.template()}`;
			return;
		}
		this.root.innerHTML = this.template();
	}

	/** Adopt the shared component sheet onto the render root when it's a real shadow root;
	 * a light-DOM root leans on the already-global sheet, so the `in` guard skips it. */
	protected adoptComponentSheet(): void {
		const sheet = componentStyleSheet();
		if (sheet && "adoptedStyleSheets" in this.root) {
			(this.root as ShadowRoot).adoptedStyleSheets = [sheet];
		}
	}

	/**
	 * Forward a click on slotted (light-DOM) label content to a shadow-DOM control. A native
	 * `<label>` only activates its control for clicks inside its own tree, so slotted label text
	 * never reaches a control rendered in the shadow root — clicking the visible label does
	 * nothing. Call from a host `click` listener: it no-ops on direct control hits (the box
	 * already toggled, so the toggle never doubles) and only forwards when the click passed
	 * through a `<slot>`.
	 */
	protected forwardSlottedLabelClick(event: Event, control: HTMLElement | null | undefined): void {
		if (!control) return;
		const path = event.composedPath();
		if (path.includes(control)) return;
		if (path.some((node) => node instanceof HTMLSlotElement)) control.click();
	}

	/** Reflect a boolean prop to a bare attribute (present/absent). */
	protected reflectBoolean(name: string, value: boolean): void {
		if (value) this.setAttribute(name, "");
		else this.removeAttribute(name);
	}

	/**
	 * Reflect a string prop to an attribute, removing it when nullish or empty.
	 * A framework that assigns `el.prop = undefined` (Svelte sets custom-element
	 * properties) would otherwise stamp the literal `"undefined"` via `setAttribute`.
	 */
	protected reflectString(name: string, value: string | null | undefined): void {
		if (value == null || value === "") this.removeAttribute(name);
		else this.setAttribute(name, value);
	}

	/**
	 * Reflect a string prop to an attribute and drive the inner control's live `.value`
	 * property. A user-modified control is dirty — its `.value` no longer tracks the
	 * content attribute — so `reflectString` alone leaves stale text when programmatically
	 * clearing the field. The live element is resolved via a getter *after* the attribute
	 * write because `reflectString` can trigger a synchronous `attributeChangedCallback`
	 * that rebuilds the DOM; reading the element before that write would capture a
	 * potentially stale reference.
	 */
	protected reflectStringLive(
		name: string,
		value: string | null | undefined,
		getLiveElement: () => { value: string } | null | undefined,
	): void {
		const next = value == null ? "" : String(value);
		this.reflectString(name, next);
		const el = getLiveElement();
		if (el && el.value !== next) el.value = next;
	}
}

/**
 * A convenience base for a standalone element that decorates or enhances its own light-DOM
 * children (a `Table` header, a `Carousel` track, a `Timeline` list) instead of rendering a
 * shadow template from bindings. Defaults to `scoped` styling, an empty template, and a no-op
 * `render()` so the base's first-connect render is harmless; override `render()` only when the
 * element still needs that per-connect hook to do real work (e.g. `XtyleDockZone`).
 */
export abstract class XtyleDecoratorElement extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "scoped";
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {}
}

export function define(name: string, ctor: CustomElementConstructor): void {
	if (typeof customElements === "undefined") return;
	if (!customElements.get(name)) customElements.define(name, ctor);
}

/**
 * Read a light-DOM control attribute that a framework may have set as a DOM property
 * instead — Svelte sets `value`/`open`/`disabled` as properties on a plain element
 * rather than attributes, so an attribute-only read misses them. Astro and hand-written
 * HTML set real attributes; this accepts both.
 */
export function readAttrOrProp(el: HTMLElement, name: string): string | null {
	const attr = el.getAttribute(name);
	if (attr !== null) return attr;
	const prop = (el as unknown as Record<string, unknown>)[name];
	return typeof prop === "string" ? prop : null;
}

/** The boolean counterpart of `readAttrOrProp` — present attribute or `true` property. */
export function readBoolAttrOrProp(el: HTMLElement, name: string): boolean {
	if (el.hasAttribute(name)) return true;
	return (el as unknown as Record<string, unknown>)[name] === true;
}

export function escapeHtml(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function escapeAttr(value: string): string {
	return escapeHtml(value).replace(/"/g, "&quot;");
}

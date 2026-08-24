import { componentStyleSheet } from "../css/index.js";
import { THEME_APPLY_EVENT } from "../dom.js";
import { markFormNameUnbound, markFormNameDoubled } from "./fragment-host.js";

const CHILD_IDENTITY_ATTRS = ["data-value", "value", "disabled", "aria-disabled", "selected"];

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

/**
 * Whether an element is upgrading over pre-rendered light-DOM structure composed by the Astro SSR
 * binding, which is what `auto` mode keys on: found means stay light and adopt it, absent means
 * attach a shadow root and project the consumer's framework-owned children through native `<slot>`.
 *
 * Direct children only. The composed scaffold's `[data-root]` is always a direct child, while a
 * nested auto component (e.g. a `<xtyle-text>` inside a slotted panel) carries its own deeper
 * `[data-root]` — a descendant search would mistake that for this element's own scaffold.
 */
export function hasComposedScaffold(el: Element): boolean {
	return Array.from(el.children).some((child) => child.hasAttribute("data-root"));
}

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
		const mode = this.styleMode;
		const light = mode === "auto" ? hasComposedScaffold(this) : mode !== "isolated";
		this.root = light
			? (this as unknown as ShadowRoot)
			: (this.shadowRoot ?? this.attachShadow({ mode: "open" }));
	}

	/** Whether this instance rendered behind a real shadow root rather than into light DOM. */
	/**
	 * A validity message, never empty. `setValidity` throws when a flag is set and the message is
	 * blank, and an attribute written as `error=""` is *present* — so `??` reads it as supplied and
	 * hands the empty string straight through. Any consumer binding a possibly-empty error string,
	 * which is the ordinary shape in every framework, crashed the element on that path.
	 */
	protected validityMessage(attribute: string, fallback: string): string {
		const stated = this.getAttribute(attribute);
		return stated !== null && stated.trim() !== "" ? stated : fallback;
	}

	protected isShadow(): boolean {
		return (this.root as unknown as Node) !== (this as unknown as Node);
	}

	/** A form-associated subclass returns its `ElementInternals` here to publish the standard
	 * constraint-validation surface below. Returning `null` leaves the element non-validating. */
	protected formInternals(): ElementInternals | null {
		return null;
	}

	/**
	 * Whether something this component renders into light DOM carries the host's `name` and posts on
	 * its own — the fill's control, or a hidden mirror the element appends. `true` means the host must
	 * stay out of `setFormValue` in light DOM or the value posts twice; `false` means the host's
	 * `ElementInternals` is the only channel in either mode. A subclass declares which it is; the two
	 * halves must not both be true, and `verifyFormName` checks the declaration against the DOM.
	 */
	protected get fillOwnsFormName(): boolean {
		return false;
	}

	/** Whether the host should report this value through `ElementInternals`. */
	protected reportsFormValue(): boolean {
		return this.isShadow() || !this.fillOwnsFormName;
	}

	/** Check, after the fill has mounted, that light DOM matches what `fillOwnsFormName` declares:
	 * a control carrying the `name` when it claims one, and none when it does not. */
	protected verifyFormName(): void {
		if (this.isShadow()) return;
		const name = this.getAttribute("name");
		if (!name) return;
		const bound = Array.from(this.querySelectorAll("[name]")).some(
			(node) => node.getAttribute("name") === name,
		);
		if (bound === this.fillOwnsFormName) {
			this.removeAttribute("data-xtyle-form-unbound");
			this.removeAttribute("data-xtyle-form-doubled");
			return;
		}
		if (this.fillOwnsFormName) markFormNameUnbound(this, name);
		else markFormNameDoubled(this, name);
	}

	get validity(): ValidityState | undefined {
		return this.formInternals()?.validity;
	}

	get validationMessage(): string {
		return this.formInternals()?.validationMessage ?? "";
	}

	get willValidate(): boolean {
		return this.formInternals()?.willValidate ?? false;
	}

	get form(): HTMLFormElement | null {
		return this.formInternals()?.form ?? null;
	}

	checkValidity(): boolean {
		return this.formInternals()?.checkValidity() ?? true;
	}

	reportValidity(): boolean {
		return this.formInternals()?.reportValidity() ?? true;
	}

	/** The element's shadow markup. Required; a subclass overrides it to re-shape output. */
	protected abstract template(): string;

	/**
	 * Whether the internal control takes part in sequential focus navigation. A component that renders a
	 * natively focusable element makes it tab-reachable whether or not the app wants a second cursor:
	 * a consumer driving selection from its own keyboard cursor gets two focus rings that diverge, and
	 * Enter activates through both, firing one keypress twice. `focusable="false"` opts the control out.
	 *
	 * The host's own `tabindex` cannot express this — focus lands on the inner control, not the host —
	 * and setting `tabindex` on that control from outside does not survive the next render.
	 */
	protected get focusable(): boolean {
		return this.getAttribute("focusable") !== "false";
	}

	/**
	 * The text a consumer slotted, for mirroring onto an internal control as its accessible name.
	 * Chromium does not carry slotted light-DOM text across the shadow boundary into a control's
	 * name-from-content, so a control whose only content is a `<slot>` computes no name at all — the
	 * label is on screen and absent from the accessibility tree. Returns `null` in light DOM, where the
	 * text is a real descendant and names the control natively, and for an empty slot.
	 */
	protected slottedName(slotName?: string): string | null {
		if (!this.shadowRoot) return null;
		const sources = slotName
			? Array.from(this.children).filter((child) => child.getAttribute("slot") === slotName)
			: Array.from(this.childNodes).filter(
					(node) => !(node instanceof Element) || !node.hasAttribute("slot"),
				);
		const text = sources
			.map((node) => node.textContent ?? "")
			.join(" ")
			.replace(/\s+/g, " ")
			.trim();
		return text ? text : null;
	}

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

	private applyingEvent: Event | null = null;

	/**
	 * Run a fragment intent with the event that provoked it in scope, so an `emitOwn` anywhere inside —
	 * including down a private helper that never sees the event — can silence the native echo without
	 * every call site threading it by hand.
	 */
	protected applying<T>(event: Event, run: () => T): T {
		const outer = this.applyingEvent;
		this.applyingEvent = event;
		try {
			return run();
		} finally {
			this.applyingEvent = outer;
		}
	}

	/**
	 * Silence the native event of this name that provoked the current intent, without emitting anything
	 * in its place. For the path that decides it has nothing to report — a commit that did not change
	 * the value — where the echo still has to be stopped, or it reaches the consumer alone and unlabelled.
	 */
	protected silenceEcho(type: string, source?: Event | null): void {
		const echo = source ?? this.applyingEvent;
		if (echo && echo.type === type && echo.composedPath()[0] !== this) {
			echo.stopImmediatePropagation();
		}
	}

	/**
	 * Emit the component's own event, silencing the native one that provoked it.
	 *
	 * An inner `<input>` fires native `input` / `change` / `select` that bubble to the host — and
	 * `input` crosses a shadow boundary too — so an element that answers one by dispatching its own
	 * leaves a consumer listening on the host hearing both: twice per interaction, the echo carrying
	 * no `detail`. The echo stops at the moment the element speaks in its place, taken from `source`
	 * or from the intent `applying` currently has in flight.
	 *
	 * `composedPath()[0]` is what distinguishes them, not `target`: a composed event is retargeted to
	 * the host on its way out, so `target` reads as the host for an event the inner control fired.
	 *
	 * Only for an element that emits its own event. One whose declared event *is* the native event
	 * passing through calls nothing — the native event is the contract.
	 */
	protected emitOwn(type: string, source?: Event | null, detail?: unknown): void {
		this.silenceEcho(type, source);
		this.dispatchEvent(
			detail === undefined
				? new Event(type, { bubbles: true, composed: true })
				: new CustomEvent(type, { bubbles: true, composed: true, detail }),
		);
	}

	connectedCallback(): void {
		if (this.resolvesThemeAtRuntime && !this.themeListener && typeof document !== "undefined") {
			this.themeListener = () => {
				if (this.hydrated && this.root.firstChild) this.render();
			};
			document.addEventListener(THEME_APPLY_EVENT, this.themeListener);
		}
		if (this.hydrated) return;
		this.hydrated = true;
		this.render();
	}

	disconnectedCallback(): void {
		if (this.themeListener) {
			document.removeEventListener(THEME_APPLY_EVENT, this.themeListener);
			this.themeListener = undefined;
		}
		this.childObserver?.disconnect();
		this.childObserver = undefined;
	}

	private childObserver?: MutationObserver;

	/**
	 * Re-render whenever the host's light-DOM children change.
	 *
	 * A component that reads `this.children` rather than projecting through a `<slot>` holds a copy taken
	 * at render time, and every framework renders a list as an effect that runs *after* the element is
	 * inserted — so a loop-rendered child arrives one tick too late and is never seen. Watching the
	 * subtree is what makes the read live; the connect-time read alone cannot be made correct.
	 *
	 * The identity attributes are watched too, because a child can arrive before it is keyed. A read
	 * that lands in that window sees no key, falls back to positional ones, and a requested value that
	 * matches none of them selects the first item instead — permanently, since nothing else would
	 * re-render. None of these are attributes an element writes back to a light child, so watching them
	 * cannot feed itself.
	 */
	protected observeChildren(): void {
		if (typeof MutationObserver === "undefined" || this.childObserver) return;
		this.childObserver = new MutationObserver((records) => {
			if (!this.isConnected || !this.root.firstChild) return;
			if (records.every((record) => this.isOwnMutation(record))) return;
			this.render();
		});
		this.childObserver.observe(this, {
			childList: true,
			subtree: true,
			characterData: true,
			attributes: true,
			attributeFilter: CHILD_IDENTITY_ATTRS,
		});
	}

	private isOwnMutation(record: MutationRecord): boolean {
		if (this.isOwnPaint(record.target)) return true;
		if (record.type !== "childList") return false;
		const touched = [...record.addedNodes, ...record.removedNodes];
		return touched.length > 0 && touched.every((node) => this.isOwnPaint(node));
	}

	/**
	 * True for a node the element painted itself. Under a light-DOM render the scaffold lives among the
	 * author's children, so an unfiltered observer would see its own output and re-render forever.
	 *
	 * The default answers from `[data-root]`, which holds while a fill paints a single root-level
	 * subtree. An element whose fill renders root-level siblings outside that marker overrides this and
	 * defers to its `FragmentHost`, which records what the scaffold actually produced.
	 */
	protected isOwnPaint(node: Node | null): boolean {
		for (let at: Node | null = node; at && at !== this; at = at.parentNode) {
			if (at instanceof Element && at.hasAttribute("data-root")) return true;
		}
		return false;
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

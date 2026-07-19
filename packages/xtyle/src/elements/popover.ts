import { XtyleElement, define, type StyleMode } from "./base.js";
import { anchorArrowOffset, placeOverlay, type OverlayRect } from "./overlay-position.js";
import {
	popoverHostCss,
	type PopoverAlign,
	type PopoverCloseReason,
	type PopoverFocus,
	type PopoverPanelRole,
	type PopoverPlacement,
} from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/popover/source.generated.js";
import { resolveVocab, POPOVER_PLACEMENTS, POPOVER_ALIGNS, POPOVER_PANEL_ROLES, POPOVER_FOCUS } from "../vocab.js";

export type { PopoverPlacement, PopoverAlign, PopoverFocus, PopoverPanelRole, PopoverCloseReason } from "../markup/index.js";

/** Per-open overrides for `show` / `openAt` / `openFrom`; anything omitted falls back to the element's own attributes. */
export interface PopoverOpenOptions {
	/** Preferred side of the anchor; flips when there is no room. */
	placement?: PopoverPlacement;
	/** Cross-axis alignment against the anchor; flips `start` ↔ `end` near an edge. */
	align?: PopoverAlign;
	/** Space between the anchor and the panel, in px. */
	gap?: number;
	/** Where focus lands once the panel is open. */
	focus?: PopoverFocus;
}

/** What the popover is currently anchored to — reported on the `open` event. */
export type PopoverAnchorKind = "trigger" | "element" | "point";

const FOCUSABLE =
	'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const NON_VISUAL = new Set(["SCRIPT", "STYLE", "TEMPLATE", "LINK"]);

/** The window in which a click on the trigger is really the tail of the light-dismiss that just closed
 * the panel — swallowed so the trigger toggles closed instead of instantly reopening. */
const REOPEN_GUARD_MS = 250;

let popoverSeq = 0;

/**
 * The generic anchored surface: a floating panel tethered to a trigger, to any element, or to a bare
 * viewport point, with flipping placement, light-dismiss, Escape, an optional arrow, and a modal or
 * non-modal focus posture.
 *
 * The panel is a `<dialog popover>` and the element opens it through whichever door the posture really
 * needs. Non-modal takes the native Popover API: the top layer, light-dismiss and Escape without a
 * z-index war or a document listener, and a page that stays live behind it. Modal takes
 * `<dialog>.showModal()`, so the background is made *inert by the platform* — the same inertness Dialog
 * and Sheet get — and the panel's `aria-modal` is a fact rather than a claim. The Popover API alone
 * never makes the background inert, so a scrim and a JavaScript focus trap on top of it would leave a
 * screen reader free to browse straight out of a panel that says it cannot be left.
 *
 * Popover owns no content: the panel body and the trigger are both the consumer's, projected through
 * slots. It owns the surface *around* them — panel, arrow, placement, dismissal, focus — which is what
 * makes it the substrate the other anchored surfaces (Combobox, CommandPalette) build on rather than
 * re-deriving.
 */
export class XtylePopover extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private uid = `xtyle-popover-${popoverSeq++}`;
	private pointAnchor: OverlayRect | null = null;
	private elementAnchor: HTMLElement | null = null;
	private openOpts: PopoverOpenOptions = {};
	private returnFocusTo: HTMLElement | null = null;
	private closeReason: PopoverCloseReason = "dismiss";
	private dismissedAt = 0;
	private swallowClick = false;
	private wiredTrigger: HTMLElement | null = null;
	private wiredPanel: HTMLElement | null = null;
	private hostWired = false;
	private docWired = false;
	private viewportWired = false;
	/** Whether the panel is currently up in the top layer, whichever door put it there. The two doors
	 * announce themselves differently (`toggle` for a popover, `close` for a dialog — and some engines
	 * now fire both), so the lifecycle is driven off this rather than off any one platform event. */
	private up = false;
	/** True across a posture swap — `modal` flipped on an already-open panel — while it is taken down
	 * through one door and put back up through the other. The close and the open that swap emits belong
	 * to the swap, not to the panel, so neither is announced. */
	private settling = false;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "popover", {
		applyIntent: () => {},
		afterApply: () => this.afterApply(),
	});

	static get observedAttributes(): string[] {
		return [
			"open",
			"placement",
			"align",
			"gap",
			"arrow",
			"modal",
			"flush",
			"for",
			"label",
			"labelledby",
			"panel-role",
			"focus-on-open",
			"no-close-on-select",
			"no-light-dismiss",
		];
	}

	/** Reflects (and controls) whether the panel is open. Setting it opens/closes without touching focus;
	 * `show()` / `openAt()` / `openFrom()` are the focus-managing doors. */
	get open(): boolean {
		return this.hasAttribute("open");
	}
	set open(value: boolean) {
		this.reflectBoolean("open", value);
	}

	/** Preferred side of the anchor. Flips to the opposite side when the panel does not fit. Defaults to `bottom`. */
	get placement(): PopoverPlacement {
		return resolveVocab(this.getAttribute("placement"), POPOVER_PLACEMENTS, "bottom", "popover placement");
	}
	set placement(value: PopoverPlacement) {
		this.reflectString("placement", value);
	}

	/** Cross-axis alignment against the anchor. Defaults to `center`. */
	get align(): PopoverAlign {
		return resolveVocab(this.getAttribute("align"), POPOVER_ALIGNS, "center", "popover align");
	}
	set align(value: PopoverAlign) {
		this.reflectString("align", value);
	}

	/** Space between the anchor and the panel, in px. Defaults to `8` — enough for the arrow to sit in. */
	get gap(): number {
		const raw = Number(this.getAttribute("gap"));
		return Number.isFinite(raw) && this.hasAttribute("gap") ? raw : 8;
	}
	set gap(value: number) {
		this.reflectString("gap", String(value));
	}

	/** Draw the arrow: a real node in the fragment, tethered to the anchor's center whatever the alignment did. */
	get arrow(): boolean {
		return this.hasAttribute("arrow");
	}
	set arrow(value: boolean) {
		this.reflectBoolean("arrow", value);
	}

	/** Modal posture: the panel opens as a modal `<dialog>`, so the platform makes the background inert —
	 * unreachable by pointer, by Tab, and by a screen reader's browse mode alike — behind a scrim, with
	 * clicks outside dismissed without reaching what they landed on. Non-modal (the default) opens the
	 * same panel as a native popover and leaves the page live behind an ordinary light-dismissible
	 * surface. */
	get modal(): boolean {
		return this.hasAttribute("modal");
	}
	set modal(value: boolean) {
		this.reflectBoolean("modal", value);
	}

	/** Drop the panel's padding so slotted content (a list, a menu, an image) reaches its edges. */
	get flush(): boolean {
		return this.hasAttribute("flush");
	}
	set flush(value: boolean) {
		this.reflectBoolean("flush", value);
	}

	/** The `id` of an element elsewhere in the document that anchors *and* toggles the popover — the
	 * escape hatch for a trigger that cannot be a child (a toolbar button, an input the consumer owns). */
	get for(): string | null {
		return this.getAttribute("for");
	}
	set for(value: string | null | undefined) {
		this.reflectString("for", value);
	}

	/** The panel's accessible name. A `dialog`-role panel needs one (or `labelledby`). */
	get label(): string | null {
		return this.getAttribute("label");
	}
	set label(value: string | null | undefined) {
		this.reflectString("label", value);
	}

	/** The id of an element that names the panel, when the name is already on screen. */
	get labelledby(): string | null {
		return this.getAttribute("labelledby");
	}
	set labelledby(value: string | null | undefined) {
		this.reflectString("labelledby", value);
	}

	/** The ARIA role the panel carries. Defaults to `dialog`; a surface whose content brings its own
	 * semantics names the role it really is (`listbox`, `menu`) or `none` to get out of the way. */
	get panelRole(): PopoverPanelRole {
		return resolveVocab(this.getAttribute("panel-role"), POPOVER_PANEL_ROLES, "dialog", "popover panel-role");
	}
	set panelRole(value: PopoverPanelRole) {
		this.reflectString("panel-role", value);
	}

	/** Where focus lands when the panel opens through `show` / `openAt` / `openFrom`. Defaults to `first`.
	 * A type-ahead surface passes `none` so the caret never leaves its input. */
	get focusOnOpen(): PopoverFocus {
		return resolveVocab(this.getAttribute("focus-on-open"), POPOVER_FOCUS, "first", "popover focus-on-open");
	}
	set focusOnOpen(value: PopoverFocus) {
		this.reflectString("focus-on-open", value);
	}

	/** Keep the panel open when a `select` event bubbles out of its content. Off by default: a chosen
	 * option, command, or menu action closes the surface it was chosen from. */
	get noCloseOnSelect(): boolean {
		return this.hasAttribute("no-close-on-select");
	}
	set noCloseOnSelect(value: boolean) {
		this.reflectBoolean("no-close-on-select", value);
	}

	/** Suppress the panel's own light-dismiss: a non-modal panel opens as a `manual` popover, so an outside
	 * click (and Escape) no longer closes it. For a host that owns dismissal itself — a Spotlight whose veil
	 * is the dismiss surface — where the panel's independent close would fight the host and flicker. */
	get noLightDismiss(): boolean {
		return this.hasAttribute("no-light-dismiss");
	}
	set noLightDismiss(value: boolean) {
		this.reflectBoolean("no-light-dismiss", value);
	}

	/** What the panel is anchored to right now. */
	get anchorKind(): PopoverAnchorKind {
		if (this.pointAnchor) return "point";
		if (this.elementAnchor || this.forElement()) return "element";
		return "trigger";
	}

	attributeChangedCallback(name: string): void {
		if (!this.root.firstChild) return;
		if (name === "open") {
			this.syncOpen();
			return;
		}
		this.render();
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		// removal takes the panel out of the top layer without either door announcing it — a `<dialog>`
		// fires no `close` when it is detached — so the lifecycle flag is cleared here, or a popover that
		// is moved in the DOM while open would come back believing it is still up and never re-post
		this.up = false;
		this.settling = false;
		this.unwireDocument();
		this.unwireViewport();
	}

	/**
	 * Open the panel against its declared anchor — the slotted trigger, or the `for` element. The
	 * ordinary door: it places synchronously, applies the focus policy, and remembers where focus came
	 * from so closing can hand it back.
	 */
	show(opts: PopoverOpenOptions = {}): void {
		this.openWith(opts);
	}

	/**
	 * Open the panel at a point in viewport coordinates — the pointer path (`event.clientX/Y` from a
	 * `contextmenu` or a canvas click, after `preventDefault()`). Defaults to dropping from the point
	 * with its leading edge on it, flipping above and right-aligning near a viewport edge.
	 */
	openAt(x: number, y: number, opts: PopoverOpenOptions = {}): void {
		this.pointAnchor = { top: y, left: x, width: 0, height: 0 };
		this.elementAnchor = null;
		this.openWith({ ...opts, align: opts.align ?? "start" });
	}

	/**
	 * Open the panel against an arbitrary element — the substrate hook. A component that owns its own
	 * trigger (a combobox input, a command-palette launcher) keeps that element and hands it here rather
	 * than re-deriving placement; the anchor holds until the panel closes.
	 */
	openFrom(anchor: HTMLElement, opts: PopoverOpenOptions = {}): void {
		this.elementAnchor = anchor;
		this.pointAnchor = null;
		this.openWith(opts);
	}

	/**
	 * Move an already-open popover to a new anchor, re-placing it and moving focus into it — but without
	 * re-capturing the element focus returns to on close. A Tour re-points one spotlight step to step, and
	 * the callout has to follow the new target; opening afresh each step would overwrite the trigger the
	 * whole tour returns focus to. When the popover is closed this simply opens it, capturing focus as usual.
	 */
	reanchor(anchor: HTMLElement, opts: PopoverOpenOptions = {}): void {
		this.elementAnchor = anchor;
		this.pointAnchor = null;
		if (!this.open) {
			this.openWith(opts);
			return;
		}
		this.openOpts = { ...this.openOpts, ...opts };
		this.place();
		this.applyFocus(opts.focus ?? this.focusOnOpen);
	}

	/** Close the panel. `returnFocus` hands focus back to wherever it was when the panel opened. */
	hide(reason: PopoverCloseReason = "api", returnFocus = true): void {
		if (!this.open) return;
		this.closeReason = reason;
		const target = this.returnFocusTo ?? this.triggerElement();
		this.open = false;
		if (returnFocus) target?.focus();
	}

	/** Open if closed, close if open — what a trigger click does. */
	toggle(): void {
		if (this.open) this.hide("api");
		else this.show();
	}

	/**
	 * Re-place the panel against its current anchor. Call it after the panel's content changes size —
	 * a filtered list shrinking, an async body arriving — so the surface stays tethered.
	 */
	reposition(): void {
		this.place();
	}

	private openWith(opts: PopoverOpenOptions): void {
		this.openOpts = opts;
		this.captureReturnFocus();
		this.open = true;
		// the panel's `toggle` event is async, so a place() deferred to it paints one frame at 0,0
		this.place();
		this.applyFocus(opts.focus ?? this.focusOnOpen);
	}

	private get panel(): HTMLElement | null {
		return this.root.querySelector(".xtyle-popover__panel");
	}

	/** Whether the fill's panel is a `<dialog>` the platform can open modally. The built-in fill's is; a
	 * third-party fill that swaps it for a plain box is not, and a plain box in the top layer cannot be
	 * made inert — so that panel degrades to the non-modal door rather than asserting an inertness
	 * nothing delivered. */
	private canGoModal(panel: HTMLElement): panel is HTMLDialogElement {
		return typeof (panel as HTMLDialogElement).showModal === "function";
	}

	private wantsDialog(panel: HTMLElement): boolean {
		return this.modal && this.canGoModal(panel);
	}

	private dialogUp(panel: HTMLElement): boolean {
		return this.canGoModal(panel) && panel.open;
	}

	private panelUp(panel: HTMLElement): boolean {
		return this.dialogUp(panel) || panel.matches(":popover-open");
	}

	private get triggerRegion(): HTMLElement | null {
		return this.root.querySelector(".xtyle-popover__trigger");
	}

	private forElement(): HTMLElement | null {
		const id = this.for;
		if (!id || typeof document === "undefined") return null;
		return document.getElementById(id);
	}

	/** The consumer's trigger node: the `for` element, or the element they slotted. Shadow projects it
	 * through a named `<slot>`; light DOM composes it straight into the `[data-slot="trigger"]` region.
	 * Non-rendering nodes (a binding's hydration `<script>`) ride along in the composed slot and have no
	 * box, so they are never mistaken for the trigger. */
	private triggerElement(): HTMLElement | null {
		const external = this.forElement();
		if (external) return external;
		const slot = this.root.querySelector<HTMLSlotElement>('slot[name="trigger"]');
		if (slot) {
			return slot.assignedElements({ flatten: true }).find((el): el is HTMLElement => el instanceof HTMLElement) ?? null;
		}
		const region = this.triggerRegion;
		if (!region) return null;
		return (
			[...region.children].find(
				(el): el is HTMLElement => el instanceof HTMLElement && !NON_VISUAL.has(el.tagName),
			) ?? null
		);
	}

	/** Where the trigger's ARIA state belongs. A raw `<button>` carries it itself; a wrapper element (an
	 * `<xtyle-button>`) hands it to the real control inside, because that is the node assistive tech
	 * lands on — state stamped on the wrapper would never be announced. */
	private ariaTarget(trigger: HTMLElement): HTMLElement {
		if (trigger.matches('button, a[href], input, [role="button"], [role="combobox"]')) return trigger;
		const inner =
			trigger.querySelector<HTMLElement>('button, a[href], input, [role="button"]') ??
			trigger.shadowRoot?.querySelector<HTMLElement>('button, a[href], input, [role="button"]');
		return inner ?? trigger;
	}

	/** The anchor rect placement runs against: the cursor point, the `openFrom` element, the `for`
	 * element, or the trigger. A triggerless popover that was never opened at anything has no anchor —
	 * it stays unplaced rather than pinning itself to 0,0. */
	private currentAnchor(): OverlayRect | null {
		if (this.pointAnchor) return this.pointAnchor;
		const el = this.elementAnchor ?? this.forElement() ?? (this.hasTrigger() ? this.triggerRegion : null);
		if (!el) return null;
		const rect = el.getBoundingClientRect();
		return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
	}

	private hasTrigger(): boolean {
		return this.fragment.hasSlotted("trigger");
	}

	private get bindings(): Record<string, unknown> {
		return {
			panelId: `${this.uid}-panel`,
			hasTrigger: this.hasTrigger(),
			arrow: this.arrow,
			modal: this.modal,
			flush: this.flush,
			panelRole: this.panelRole,
			label: this.label,
			labelledby: this.labelledby,
		};
	}

	/** Place the panel against its anchor and point the arrow back at it. Runs synchronously on open and
	 * again on every scroll/resize while open. */
	private place(): void {
		const panel = this.panel;
		const anchor = this.currentAnchor();
		if (!panel || !anchor || typeof window === "undefined") return;
		const content = { width: panel.offsetWidth || 224, height: panel.offsetHeight || 0 };
		const placed = placeOverlay({
			anchor,
			content,
			viewport: { width: window.innerWidth, height: window.innerHeight },
			preferred: this.openOpts.placement ?? this.placement,
			align: this.openOpts.align ?? this.align,
			gap: this.openOpts.gap ?? this.gap,
		});
		panel.style.left = `${placed.left}px`;
		panel.style.top = `${placed.top}px`;
		panel.setAttribute("data-placement", placed.placement);
		panel.setAttribute("data-align", placed.align);
		panel.style.setProperty(
			"--xtyle-pop-arrow",
			`${anchorArrowOffset({ placement: placed.placement, placedLeft: placed.left, placedTop: placed.top, anchor, content })}px`,
		);
	}

	private syncOpen(): void {
		const panel = this.panel;
		if (!panel || !panel.isConnected) return;
		// `showPopover()` / `showModal()` throw if the element isn't in a stable state — which happens
		// when a host framework sets `open` synchronously during its own mount (e.g. a Svelte
		// `client:only` island). Swallow it; the next open/close, or the connect-time `afterApply`,
		// settles it.
		try {
			if (!this.open) {
				if (this.panelUp(panel)) this.dismissPanel(panel);
			} else if (!this.panelUp(panel)) {
				this.showPanel(panel);
			} else if (this.dialogUp(panel) !== this.wantsDialog(panel)) {
				this.reposture(panel);
			}
		} catch {
			this.settling = false;
		}
		this.syncModality(panel);
		this.syncTriggerAria();
	}

	/** Put the panel up through the door the posture earns: a modal `<dialog>` when `modal` is set (the
	 * platform makes the background inert), and the native popover otherwise. A `<dialog>` has no
	 * `toggle` event to wait on in every engine, so the open half of the lifecycle is driven here rather
	 * than from a platform notification that may never come. */
	private showPanel(panel: HTMLElement): void {
		if (this.wantsDialog(panel)) {
			(panel as HTMLDialogElement).showModal();
			this.handleOpened();
			return;
		}
		// `manual` vs `auto` is read by the platform at `showPopover()`, so the mode is set on the panel right
		// before it opens: a manual popover skips the browser's light-dismiss, leaving dismissal to the host.
		panel.setAttribute("popover", this.noLightDismiss ? "manual" : "auto");
		panel.showPopover();
	}

	private dismissPanel(panel: HTMLElement): void {
		if (this.dialogUp(panel)) {
			(panel as HTMLDialogElement).close();
			return;
		}
		panel.hidePopover();
	}

	/** `modal` flipped on an already-open panel: take it down through the door it went up and put it
	 * back up through the other, so the posture the attributes claim is the one the platform enforces. */
	private reposture(panel: HTMLElement): void {
		this.settling = true;
		this.dismissPanel(panel);
		this.showPanel(panel);
	}

	/** `aria-modal` is a claim about platform inertness, so it only survives on a panel that really got
	 * it. The fill stamps the attribute from the `modal` binding; a panel that is not a `<dialog>` never
	 * had `showModal()` to open it with, so the claim is struck rather than asserted on its behalf. */
	private syncModality(panel: HTMLElement): void {
		if (this.modal && this.canGoModal(panel)) return;
		panel.removeAttribute("aria-modal");
	}

	private handleOpened(): void {
		if (this.up) return;
		this.up = true;
		this.place();
		this.wireViewport();
		this.syncTriggerAria();
		if (this.settling) {
			this.settling = false;
			return;
		}
		if (!this.open) this.open = true;
		this.dispatchEvent(new Event("open", { bubbles: true, composed: true }));
	}

	private handleClosed(): void {
		if (!this.up) return;
		this.up = false;
		if (this.settling) return;
		// a panel dismissed while it still holds focus (light-dismiss on a focused control, a
		// programmatic close) would drop focus to the body; hand it back where it came from
		const target = this.returnFocusTo ?? this.triggerElement();
		const stranded = this.holdsFocus();
		const reason = this.closeReason;
		if (reason === "dismiss") this.dismissedAt = this.now();
		this.pointAnchor = null;
		this.elementAnchor = null;
		this.openOpts = {};
		this.returnFocusTo = null;
		this.closeReason = "dismiss";
		this.unwireViewport();
		if (this.open) this.open = false;
		this.syncTriggerAria();
		if (stranded) target?.focus();
		this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true, detail: { reason } }));
	}

	private onToggle = (event: Event): void => {
		const state = (event as { newState?: string }).newState;
		if (state === "open") this.handleOpened();
		else if (state === "closed") this.handleClosed();
	};

	/** The `<dialog>` half of the lifecycle: `close` is the only notification a modal dialog gives on the
	 * way down, and `cancel` is the platform saying Escape did it. */
	private onNativeClose = (): void => {
		this.handleClosed();
	};

	private onNativeCancel = (): void => {
		this.closeReason = "escape";
	};

	private now(): number {
		return typeof performance !== "undefined" ? performance.now() : Date.now();
	}

	/** Whether the keyboard focus currently sits on one of the popover's own nodes (shadow or light). */
	private holdsFocus(): boolean {
		if ((this.root as ShadowRoot).activeElement) return true;
		if (typeof document === "undefined") return false;
		const active = document.activeElement;
		return active instanceof Node && active !== this && this.contains(active);
	}

	private captureReturnFocus(): void {
		if (typeof document === "undefined") return;
		const active = document.activeElement as HTMLElement | null;
		if (!active || active === document.body || active === document.documentElement) return;
		if (active === this || this.contains(active)) return;
		this.returnFocusTo = typeof active.focus === "function" ? active : null;
	}

	/** The panel's focus ring, in DOM order. In light DOM the consumer's body sits inside the panel, so a
	 * plain query finds it; in shadow DOM the body is projected and lives on the host, so it has to be
	 * read off the slot's assigned nodes instead — the same content, a different tree. */
	private focusables(): HTMLElement[] {
		const panel = this.panel;
		if (!panel) return [];
		const own = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
		if (own.length > 0) return own;
		return this.fragment
			.slottedNodes()
			.flatMap((node) =>
				node instanceof HTMLElement
					? [...(node.matches(FOCUSABLE) ? [node] : []), ...node.querySelectorAll<HTMLElement>(FOCUSABLE)]
					: [],
			);
	}

	private applyFocus(focus: PopoverFocus): void {
		if (focus === "none") return;
		const panel = this.panel;
		if (!panel) return;
		if (focus === "panel") {
			panel.focus();
			return;
		}
		const first = this.focusables()[0];
		(first ?? panel).focus();
	}

	private activeElementInPanel(): Element | null {
		const shadow = (this.root as ShadowRoot).activeElement;
		if (shadow) return shadow;
		return typeof document === "undefined" ? null : document.activeElement;
	}

	/** The modal focus trap. A modal `<dialog>` already contains Tab natively, so this is the belt to the
	 * platform's braces: it holds the same line for a fill whose panel is not a dialog, and it wraps the
	 * ring the element's own focus order defines. A non-modal popover never traps — Tab leaves it, which
	 * is exactly what a disclosure surface should do. */
	private onPanelKeydown = (event: KeyboardEvent): void => {
		if (event.key === "Escape") {
			this.closeReason = "escape";
			return;
		}
		if (!this.modal || event.key !== "Tab") return;
		const focusables = this.focusables();
		if (focusables.length === 0) {
			event.preventDefault();
			return;
		}
		const first = focusables[0]!;
		const last = focusables[focusables.length - 1]!;
		const active = this.activeElementInPanel();
		if (event.shiftKey && (active === first || active === this.panel)) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && active === last) {
			event.preventDefault();
			first.focus();
		}
	};

	/** Escape closes the top-layer panel wherever focus sits, so the reason is recorded document-wide
	 * rather than only when the panel itself has focus. */
	private onDocumentKeydown = (event: KeyboardEvent): void => {
		if (this.open && event.key === "Escape") this.closeReason = "escape";
	};

	/** Modal dismissal: a pointer landing outside the panel closes it *and* is swallowed, so the button
	 * it happened to land on does not also fire. A modal `<dialog>` gives neither for free — the platform
	 * makes the page inert but never closes on an outside click — so both stay the element's job. */
	private onDocumentPointerDown = (event: Event): void => {
		if (!this.modal || !this.open) return;
		if (!this.landedOutside(event)) return;
		this.swallowClick = true;
		event.preventDefault();
		event.stopPropagation();
		this.hide("dismiss");
	};

	/** Whether a pointer landed anywhere but on the panel. A modal `<dialog>`'s `::backdrop` is a
	 * pseudo-element, so the platform retargets a hit on it to the dialog itself: the panel being on the
	 * composed path is not proof the pointer touched it, and only the geometry tells a backdrop hit from
	 * a panel hit. */
	private landedOutside(event: Event): boolean {
		const panel = this.panel;
		if (!panel) return false;
		const path = event.composedPath();
		if (!path.includes(panel)) return true;
		if (path[0] !== panel || !(event instanceof MouseEvent)) return false;
		const rect = panel.getBoundingClientRect();
		if (rect.width === 0 && rect.height === 0) return false;
		return (
			event.clientX < rect.left ||
			event.clientX > rect.right ||
			event.clientY < rect.top ||
			event.clientY > rect.bottom
		);
	}

	private onDocumentClick = (event: Event): void => {
		if (!this.swallowClick) return;
		this.swallowClick = false;
		event.preventDefault();
		event.stopPropagation();
	};

	private onTriggerClick = (): void => {
		if (this.open) {
			this.hide("api");
			return;
		}
		// the pointer that light-dismissed the panel a moment ago is the same one landing here; without
		// this the trigger would close and instantly reopen, and a click would never shut the popover
		if (this.now() - this.dismissedAt < REOPEN_GUARD_MS) return;
		this.show();
	};

	/** A choice made inside the panel closes it: the `select` an option list, a menu, or a command list
	 * bubbles is the same event the rest of the overlay family speaks, so the surface built on Popover
	 * dismisses itself without wiring anything. `<input>` / `<textarea>` fire a bubbling `select` of their
	 * own when the user drags across their text — that is a selection, not a choice, and must not close. */
	private onContentSelect = (event: Event): void => {
		if (this.noCloseOnSelect || !this.open || event.target === this) return;
		const target = event.target;
		if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
		this.hide("select");
	};

	private onViewportChange = (): void => {
		this.place();
	};

	private wireViewport(): void {
		if (this.viewportWired || typeof window === "undefined") return;
		this.viewportWired = true;
		window.addEventListener("scroll", this.onViewportChange, { capture: true, passive: true });
		window.addEventListener("resize", this.onViewportChange);
	}

	private unwireViewport(): void {
		if (!this.viewportWired || typeof window === "undefined") return;
		this.viewportWired = false;
		window.removeEventListener("scroll", this.onViewportChange, { capture: true });
		window.removeEventListener("resize", this.onViewportChange);
	}

	private wireDocument(): void {
		if (this.docWired || typeof document === "undefined") return;
		this.docWired = true;
		document.addEventListener("keydown", this.onDocumentKeydown, true);
		document.addEventListener("pointerdown", this.onDocumentPointerDown, true);
		document.addEventListener("click", this.onDocumentClick, true);
	}

	private unwireDocument(): void {
		if (!this.docWired || typeof document === "undefined") return;
		this.docWired = false;
		document.removeEventListener("keydown", this.onDocumentKeydown, true);
		document.removeEventListener("pointerdown", this.onDocumentPointerDown, true);
		document.removeEventListener("click", this.onDocumentClick, true);
	}

	private syncTriggerAria(): void {
		const trigger = this.triggerElement();
		if (!trigger) return;
		const target = this.ariaTarget(trigger);
		target.setAttribute("aria-haspopup", this.panelRole === "none" ? "true" : this.panelRole);
		target.setAttribute("aria-expanded", String(this.open));
		target.setAttribute("aria-controls", `${this.uid}-panel`);
	}

	/** Wire the seams the fragment cannot declare: the consumer's own trigger (slotted or `for`-referenced,
	 * so it is not the fill's markup to bind), both of the panel's platform lifecycles (`toggle` for the
	 * popover door, `close` / `cancel` for the dialog one), and the document-level guards the modal
	 * posture needs. Guarded per node so a re-render never double-binds. */
	private wire(): void {
		const trigger = this.triggerElement();
		if (trigger !== this.wiredTrigger) {
			this.wiredTrigger?.removeEventListener("click", this.onTriggerClick);
			this.wiredTrigger = trigger;
			trigger?.addEventListener("click", this.onTriggerClick);
		}
		const panel = this.panel;
		if (panel && panel !== this.wiredPanel) {
			this.wiredPanel?.removeEventListener("toggle", this.onToggle);
			this.wiredPanel?.removeEventListener("keydown", this.onPanelKeydown);
			this.wiredPanel?.removeEventListener("close", this.onNativeClose);
			this.wiredPanel?.removeEventListener("cancel", this.onNativeCancel);
			this.wiredPanel = panel;
			panel.addEventListener("toggle", this.onToggle);
			panel.addEventListener("keydown", this.onPanelKeydown);
			panel.addEventListener("close", this.onNativeClose);
			panel.addEventListener("cancel", this.onNativeCancel);
		}
		if (!this.hostWired) {
			this.hostWired = true;
			this.addEventListener("select", this.onContentSelect);
		}
		this.wireDocument();
	}

	private afterApply(): void {
		this.wire();
		this.syncTriggerAria();
		this.warnIfUnnamed();
		this.syncOpen();
	}

	private warnIfUnnamed(): void {
		if (this.panelRole !== "dialog") return;
		if (this.label || this.labelledby || this.getAttribute("aria-label")) return;
		console.warn(
			"xtyle-popover: no accessible name. Provide a `label` or `labelledby` so the panel is announced, or set `panel-role` to the role its content really is.",
		);
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(popoverHostCss);
		this.fragment.update(this.bindings);
		this.wire();
	}
}

define("xtyle-popover", XtylePopover);

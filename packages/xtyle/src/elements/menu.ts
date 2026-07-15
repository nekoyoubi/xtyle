import { XtyleElement, define, type StyleMode } from "./base.js";
import { placeOverlay, type OverlayAlign, type OverlayPlacement, type OverlayRect } from "./overlay-position.js";
import { menuHostCss, type MenuItem } from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/menu/source.generated.js";

export type { MenuItem, MenuAction } from "../markup/index.js";

/** How `openAt` opens the menu at a point. */
export interface MenuOpenAtOptions {
	/** Which action takes focus on open. `none` leaves focus where the pointer left it. Defaults to `first`. */
	focus?: "first" | "last" | "none";
	/** Preferred side of the point; flips when there is no room. Defaults to `bottom`. */
	placement?: OverlayPlacement;
	/** Cross-axis alignment against the point; flips `start` ↔ `end` near an edge. Defaults to `start`. */
	align?: OverlayAlign;
}

let menuSeq = 0;

export class XtyleMenu extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private uid = `xtyle-menu-${menuSeq++}`;
	private itemsProp: MenuItem[] | null = null;
	private needsWire = false;
	private cursorAnchor: OverlayRect | null = null;
	private cursorPlacement: OverlayPlacement = "bottom";
	private cursorAlign: OverlayAlign = "start";
	private returnFocusTo: HTMLElement | null = null;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "menu", {
		context: (handler) => (handler === "itemClick" || handler === "itemKeydown" ? this.navContext() : undefined),
		applyIntent: (intent, event) => this.applyIntent(intent, event),
		afterApply: () => this.afterApply(),
	});

	static get observedAttributes(): string[] {
		return ["items", "label", "open", "context"];
	}

	get items(): MenuItem[] {
		if (this.itemsProp) return this.itemsProp;
		const raw = this.getAttribute("items");
		if (raw) {
			try {
				return JSON.parse(raw) as MenuItem[];
			} catch {
				return [];
			}
		}
		return [];
	}
	set items(value: MenuItem[]) {
		this.itemsProp = value;
		if (this.root.firstChild) this.render();
	}

	get label(): string | null {
		return this.getAttribute("label");
	}
	set label(value: string | null | undefined) {
		this.reflectString("label", value);
	}

	get open(): boolean {
		return this.hasAttribute("open");
	}
	set open(value: boolean) {
		this.reflectBoolean("open", value);
	}

	/**
	 * Cursor-anchored mode: the same menu with no trigger, opened at a point via `openAt`
	 * (a `contextmenu` handler). The trigger is not rendered and the host collapses to
	 * `display: contents`, so the element takes no layout wherever it sits.
	 */
	get context(): boolean {
		return this.hasAttribute("context");
	}
	set context(value: boolean) {
		this.reflectBoolean("context", value);
	}

	attributeChangedCallback(name: string): void {
		if (!this.root.firstChild) return;
		if (name === "open") {
			this.fragment.update(this.bindings);
			this.syncOpen();
			this.announceOpenState();
			return;
		}
		this.render();
	}

	/** A menu closes on paths nobody outside it can see — a light dismiss, an Escape inside the popup, a
	 * chosen row — and it used to close silently, so a control that owns a menu it does not render (a split
	 * button's caret, a kebab in a row) had nothing to listen to and no way to know its `aria-expanded` had
	 * gone stale. It says so now, the way Popover already did. */
	private announceOpenState(): void {
		this.dispatchEvent(new Event(this.open ? "open" : "close", { bubbles: true, composed: true }));
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.teardown();
	}

	private get trigger(): HTMLButtonElement | null {
		return this.root.querySelector(".xtyle-menu__trigger");
	}

	private get popup(): HTMLElement | null {
		return this.root.querySelector(".xtyle-menu__popup");
	}

	private menuItems(): HTMLElement[] {
		return Array.from(this.root.querySelectorAll<HTMLElement>('[role="menuitem"]'));
	}

	private enabledItems(): HTMLElement[] {
		return this.menuItems().filter((el) => el.getAttribute("aria-disabled") !== "true");
	}

	private navContext(): { enabledValues: string[] } {
		return { enabledValues: this.enabledItems().map((el) => el.dataset.value ?? "") };
	}

	private get bindings(): Record<string, unknown> {
		return {
			items: this.items,
			label: this.label,
			open: this.open,
			context: this.context,
			popupId: `${this.uid}-popup`,
		};
	}

	/**
	 * Open the menu at a point in viewport coordinates — the `contextmenu` path. Same items,
	 * same chrome, same roving keyboard focus, same `select` event as the trigger-anchored menu;
	 * only the anchor differs. Call it from a `contextmenu` listener (after `preventDefault()`)
	 * with `event.clientX` / `event.clientY`. Escape and light-dismiss close it and return focus
	 * to wherever it was when the menu opened.
	 */
	openAt(x: number, y: number, opts: MenuOpenAtOptions = {}): void {
		this.cursorAnchor = { top: y, left: x, width: 0, height: 0 };
		this.cursorPlacement = opts.placement ?? "bottom";
		this.cursorAlign = opts.align ?? "start";
		this.captureReturnFocus();
		this.open = true;
		// the popup's `toggle` event is async, so a place() deferred to it paints one frame at 0,0
		this.place();
		const focus = opts.focus ?? "first";
		if (focus !== "none") this.focusEdge(focus);
	}

	/**
	 * Open the menu against an element that isn't its own trigger — a caret in a split button, a kebab in
	 * a row, any control that owns a menu it does not itself render. Same items, same chrome, same roving
	 * keyboard focus, same `select` event; only the anchor differs, and focus returns to the anchor.
	 */
	openFrom(anchor: HTMLElement, opts: MenuOpenAtOptions = {}): void {
		const rect = anchor.getBoundingClientRect();
		this.cursorAnchor = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
		this.cursorPlacement = opts.placement ?? "bottom";
		this.cursorAlign = opts.align ?? "start";
		this.captureReturnFocus();
		// a pointer press doesn't focus a button on every platform, so the anchor is the fallback: closing
		// must always land focus back on the control that opened the menu, never on the body
		this.returnFocusTo = this.returnFocusTo ?? anchor;
		this.open = true;
		this.place();
		const focus = opts.focus ?? "first";
		if (focus !== "none") this.focusEdge(focus);
	}

	private captureReturnFocus(): void {
		if (typeof document === "undefined") return;
		const active = document.activeElement as HTMLElement | null;
		if (!active || active === document.body || active === document.documentElement) return;
		if (active === this || this.contains(active)) return;
		this.returnFocusTo = typeof active.focus === "function" ? active : null;
	}

	private clearCursor(): void {
		this.cursorAnchor = null;
		this.cursorPlacement = "bottom";
		this.cursorAlign = "start";
		this.returnFocusTo = null;
	}

	private syncOpen(): void {
		const popup = this.popup;
		if (!popup || !popup.isConnected) return;
		const isShown = popup.matches(":popover-open");
		// `showPopover()` throws if the element isn't in a stable state — which happens when a host
		// framework sets `open` synchronously during its own mount (e.g. a Svelte `client:only`
		// island). Swallow it; the next open/close, or the connect-time `afterApply`, settles it.
		try {
			if (this.open && !isShown) popup.showPopover();
			else if (!this.open && isShown) popup.hidePopover();
		} catch {
			/* transient mid-mount state */
		}
	}

	private openMenu(focus: "first" | "last"): void {
		this.open = true;
		this.focusEdge(focus);
	}

	private focusEdge(focus: "first" | "last"): void {
		const enabled = this.enabledItems();
		const target = focus === "first" ? enabled[0] : enabled[enabled.length - 1];
		if (target) this.focusItem(target);
	}

	private closeMenu(returnFocus: boolean): void {
		const target = this.returnFocusTo ?? this.trigger;
		this.clearCursor();
		this.open = false;
		if (returnFocus) target?.focus();
	}

	private focusItem(item: HTMLElement): void {
		for (const el of this.menuItems()) el.tabIndex = el === item ? 0 : -1;
		item.focus();
	}

	private focusValue(value: string): void {
		const item = this.menuItems().find((el) => el.dataset.value === value);
		if (item) this.focusItem(item);
	}

	/** Whether the keyboard focus currently sits on one of the menu's own nodes (shadow or light). */
	private holdsFocus(): boolean {
		if ((this.root as ShadowRoot).activeElement) return true;
		if (typeof document === "undefined") return false;
		const active = document.activeElement;
		return active instanceof Node && active !== this && this.contains(active);
	}

	private positionPopup = (event: Event): void => {
		const state = (event as { newState?: string }).newState;
		if (state === "closed") {
			// a popup dismissed while it still holds focus (a programmatic close) would drop focus to
			// the body; hand it back to where it came from — the trigger, or the `openAt` caller's element
			const target = this.returnFocusTo ?? this.trigger;
			const stranded = this.holdsFocus();
			this.clearCursor();
			if (this.open) this.open = false;
			if (stranded) target?.focus();
			return;
		}
		if (state !== "open") return;
		if (!this.open) this.open = true;
		this.place();
	};

	/** Place the popup against its anchor: the cursor point when one is set (`openAt`), the trigger rect otherwise. */
	private place(): void {
		const popup = this.popup;
		if (!popup) return;
		const anchor = this.cursorAnchor ?? this.trigger?.getBoundingClientRect();
		if (!anchor) return;
		const { top, left } = placeOverlay({
			anchor,
			content: { width: popup.offsetWidth || 192, height: popup.offsetHeight || 0 },
			viewport: { width: window.innerWidth, height: window.innerHeight },
			preferred: this.cursorAnchor ? this.cursorPlacement : "bottom",
			align: this.cursorAnchor ? this.cursorAlign : "start",
		});
		popup.style.left = `${left}px`;
		popup.style.top = `${top}px`;
	}

	private afterApply(): void {
		if (this.needsWire) {
			this.popup?.addEventListener("toggle", this.positionPopup);
			this.needsWire = false;
		}
		this.warnIfUnlabeled();
		this.syncOpen();
	}

	private teardown(): void {
		this.popup?.removeEventListener("toggle", this.positionPopup);
	}

	private warnIfUnlabeled(): void {
		if (this.context) return;
		if (!this.getAttribute("label")) {
			console.warn("xtyle-menu: no trigger label. Provide a `label` so the menu button is named.");
		}
	}

	private applyIntent(intent: FragmentIntent, event: Event): void {
		if (intent.preventDefault) event.preventDefault();
		if (intent.stopPropagation) event.stopPropagation();
		if (intent.openMenu) {
			this.openMenu(intent.openMenu);
			return;
		}
		if (intent.focusValue !== undefined) {
			this.focusValue(intent.focusValue);
			return;
		}
		if (intent.activateValue !== undefined) {
			this.dispatchEvent(
				new CustomEvent("select", {
					bubbles: true,
					composed: true,
					detail: { value: intent.activateValue, label: intent.activateLabel, index: intent.activateIndex },
				}),
			);
			this.closeMenu(true);
			return;
		}
		if (intent.closeMenu) {
			this.closeMenu(intent.returnFocus ?? false);
		}
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.teardown();
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(menuHostCss);
		this.needsWire = true;
		this.fragment.remount();
		this.fragment.update(this.bindings);
	}
}

define("xtyle-menu", XtyleMenu);

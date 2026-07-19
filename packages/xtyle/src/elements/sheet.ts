import { XtyleElement, define, type StyleMode } from "./base.js";
import { sheetHostCss, type SheetSide, type SheetSize } from "../markup/sheet.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/sheet/source.generated.js";
import { resolveVocab, SHEET_SIDES, SHEET_SIZES } from "../vocab.js";

/** How far along its own extent a sheet must be dragged before release dismisses it. */
const DISMISS_FRACTION = 0.35;
/** The absolute travel that dismisses regardless of the panel's extent — the flick a tall sheet would otherwise swallow. */
const DISMISS_DISTANCE = 96;

const HANDLE_SELECTOR = "[data-handle]";
const HEADER_SELECTOR = "[data-handle-region]";
const INTERACTIVE_SELECTOR = 'button, a[href], input, select, textarea, [role="button"], [tabindex]';

interface Drag {
	pointerId: number;
	origin: number;
	extent: number;
	offset: number;
	horizontal: boolean;
}

/**
 * An edge-anchored overlay — the drawer / bottom-sheet half of the overlay family, and the touch-app
 * counterpart to `dialog`. It is built on the same native `<dialog>`, so the scrim, the focus trap,
 * focus restore, and the modal `role`/`aria-modal` semantics all come from the platform rather than
 * re-implemented JavaScript; what it adds is the `side` axis (top / right / bottom / left), a
 * safe-area-aware panel that meets the hardware edge, a non-modal posture, and a pointer
 * swipe-to-dismiss gesture layered strictly on top of the keyboard paths.
 *
 * Fragment-backed: every piece of chrome it invents — the panel, the drag handle and its grabber, the
 * header, the close button — renders through `component.sheet`, so a mod can reshape the drawer the
 * same way it can reshape any other component. Only behavior lives here.
 */
export class XtyleSheet extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private elementId = `xtyle-sheet-${Math.random().toString(36).slice(2, 8)}`;
	private rootWired = false;
	private wiredDialog: HTMLDialogElement | null = null;
	private portalMarker: Comment | null = null;
	private drag: Drag | null = null;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "sheet", {
		applyIntent: (intent, event) => this.applyIntent(intent, event),
		afterApply: () => {
			this.wireNative();
			this.syncOpen();
		},
	});

	static get observedAttributes(): string[] {
		return [
			"open",
			"side",
			"size",
			"heading",
			"label",
			"labelledby",
			"close-label",
			"no-close-button",
			"no-grabber",
			"no-swipe",
			"non-modal",
		];
	}

	get open(): boolean {
		return this.hasAttribute("open");
	}
	set open(value: boolean) {
		this.reflectBoolean("open", value);
	}

	/** Which viewport edge the sheet is anchored to; also the axis it slides and swipes along. */
	get side(): SheetSide {
		return resolveVocab(this.getAttribute("side"), SHEET_SIDES, "bottom", "sheet side");
	}
	set side(value: SheetSide) {
		this.setAttribute("side", value);
	}

	/** The sheet's extent across its anchored edge: a height for `top` / `bottom`, a width for `left` / `right`. */
	get size(): SheetSize {
		return resolveVocab(this.getAttribute("size"), SHEET_SIZES, "md", "sheet size");
	}
	set size(value: SheetSize) {
		this.setAttribute("size", value);
	}

	/** Whether the sheet opens without the scrim, the focus trap, or the inert page behind it. */
	get nonModal(): boolean {
		return this.hasAttribute("non-modal");
	}
	set nonModal(value: boolean) {
		this.reflectBoolean("non-modal", value);
	}

	get noSwipe(): boolean {
		return this.hasAttribute("no-swipe");
	}
	set noSwipe(value: boolean) {
		this.reflectBoolean("no-swipe", value);
	}

	private get dialogEl(): HTMLDialogElement | null {
		return this.root.querySelector("dialog");
	}

	/** Opens the sheet. Modal by default (native focus trap, scrim, Esc); `non-modal` opens it beside a live page. */
	showModal(): void {
		this.open = true;
	}

	/** Alias of `showModal()`, for symmetry with the native `<dialog>` surface under a `non-modal` posture. */
	show(): void {
		this.open = true;
	}

	/** Closes the sheet and restores focus to the previously focused element. */
	close(): void {
		this.open = false;
	}

	attributeChangedCallback(name: string): void {
		if (!this.root.firstChild) return;
		if (name === "open") {
			this.syncOpen();
			return;
		}
		this.render();
	}

	private get bindings(): Record<string, unknown> {
		return {
			side: this.side,
			size: this.size,
			heading: this.getAttribute("heading"),
			label: this.getAttribute("label"),
			labelledby: this.getAttribute("labelledby"),
			closeLabel: this.getAttribute("close-label"),
			noCloseButton: this.hasAttribute("no-close-button"),
			noGrabber: this.hasAttribute("no-grabber"),
			nonModal: this.nonModal,
			elementId: this.elementId,
			hasFooter: this.fragment.hasSlotted("footer"),
		};
	}

	/** Structural state the ops can't patch incrementally: whether the close button, the drag handle, and
	 * the title exist, and which accessible-name attribute the `<dialog>` carries. A change here rebuilds;
	 * side / size / heading text are cheap class and text patches. */
	private shapeSignature(): string {
		const heading = this.getAttribute("heading") != null;
		const label = this.getAttribute("label") != null;
		const labelledby = this.getAttribute("labelledby") != null;
		const close = !this.hasAttribute("no-close-button");
		const grabber = !this.hasAttribute("no-grabber");
		return `${close}|${grabber}|${heading}|${label}|${labelledby}`;
	}

	private syncOpen(): void {
		const dialog = this.dialogEl;
		if (!dialog) return;
		if (this.open) {
			this.portalToBody();
			if (!dialog.open) {
				if (this.nonModal) dialog.show();
				else dialog.showModal();
			}
		} else if (dialog.open) {
			dialog.close();
		}
	}

	/** Relocate the host to `document.body` while open. A `<dialog>` — modal in the top layer, or the
	 * non-modal one this component fixes to the viewport — anchors to the nearest ancestor that
	 * establishes a containing block (`transform`, `filter`, `backdrop-filter`, `will-change`,
	 * `contain`), so a sheet inside a transformed panel mispositions off its edge. Mounting on the body
	 * escapes any such ancestor; a marker holds its home for restore on close. */
	private portalToBody(): void {
		if (this.parentElement === document.body || !this.isConnected) return;
		if (!this.portalMarker) {
			this.portalMarker = document.createComment("xtyle-sheet");
			this.before(this.portalMarker);
		}
		document.body.appendChild(this);
	}

	private restoreFromPortal(): void {
		const marker = this.portalMarker;
		this.portalMarker = null;
		if (marker?.parentNode) {
			marker.parentNode.insertBefore(this, marker);
			marker.remove();
		}
	}

	private warnIfUnnamed(): void {
		if (!this.getAttribute("heading") && !this.getAttribute("labelledby") && !this.getAttribute("label")) {
			console.warn(
				"xtyle-sheet: no accessible name. Provide a `heading`, `label`, or `labelledby` so the sheet is announced.",
			);
		}
	}

	private applyIntent(intent: FragmentIntent, event: Event): void {
		if (intent.preventDefault) event.preventDefault();
		if (intent.requestClose) this.close();
	}

	/** The first element in an event's composed path matching `selector` and belonging to this sheet's own
	 * render root. Walking the composed path (rather than `target.closest`) is what lets a pointer landing
	 * on slotted header content still resolve the shadow chrome that owns the gesture. */
	private matchInPath(event: Event, selector: string): HTMLElement | null {
		for (const node of event.composedPath()) {
			if (node === this.root) break;
			if (node instanceof HTMLElement && node.matches(selector) && this.root.contains(node)) return node;
		}
		return null;
	}

	private get horizontal(): boolean {
		return this.side === "left" || this.side === "right";
	}

	/** Clamp raw pointer travel to the dismiss direction, so dragging a sheet *away* from its edge does nothing. */
	private dismissTravel(raw: number): number {
		switch (this.side) {
			case "bottom":
			case "right":
				return Math.max(0, raw);
			default:
				return Math.min(0, raw);
		}
	}

	/**
	 * Begin a swipe. The gesture starts only on the drag handle or on the header's own chrome — never in
	 * the body (which must stay scrollable) and never on an interactive control inside the header (whose
	 * click must stay a click). It is strictly additive: `Escape`, the close button, and `close()` remain
	 * the accessible dismissal paths, so a pointer-only gesture can never be the sole way out.
	 */
	private onPointerDown(event: PointerEvent): void {
		if (this.noSwipe || !this.open || this.drag) return;
		if (event.pointerType === "mouse" && event.button !== 0) return;
		if (this.matchInPath(event, INTERACTIVE_SELECTOR)) return;
		const handle = this.matchInPath(event, HANDLE_SELECTOR) ?? this.matchInPath(event, HEADER_SELECTOR);
		const dialog = this.dialogEl;
		if (!handle || !dialog) return;

		const rect = dialog.getBoundingClientRect();
		const horizontal = this.horizontal;
		this.drag = {
			pointerId: event.pointerId,
			origin: horizontal ? event.clientX : event.clientY,
			extent: Math.max(1, horizontal ? rect.width : rect.height),
			offset: 0,
			horizontal,
		};
		handle.setPointerCapture?.(event.pointerId);
		dialog.setAttribute("data-dragging", "");
	}

	private onPointerMove(event: PointerEvent): void {
		const drag = this.drag;
		const dialog = this.dialogEl;
		if (!drag || !dialog || event.pointerId !== drag.pointerId) return;
		const raw = (drag.horizontal ? event.clientX : event.clientY) - drag.origin;
		drag.offset = this.dismissTravel(raw);
		dialog.style.transform = drag.horizontal ? `translateX(${drag.offset}px)` : `translateY(${drag.offset}px)`;
	}

	private onPointerEnd(event: PointerEvent): void {
		const drag = this.drag;
		if (!drag || event.pointerId !== drag.pointerId) return;
		this.drag = null;
		const travel = Math.abs(drag.offset);
		this.clearDrag();
		if (travel >= drag.extent * DISMISS_FRACTION || travel >= DISMISS_DISTANCE) this.close();
	}

	private clearDrag(): void {
		const dialog = this.dialogEl;
		if (!dialog) return;
		dialog.style.transform = "";
		dialog.removeAttribute("data-dragging");
	}

	/** Wire the native `<dialog>` events the fragment scaffold can't express as handlers, plus the swipe
	 * gesture. Pointer and backdrop `click` events bubble, so they delegate on the render root once;
	 * `close` / `cancel` / `keydown` do not usefully delegate, so they attach to the live `<dialog>` and
	 * re-attach whenever a remount rebuilds it.
	 *
	 * `Escape` is handled explicitly because the platform only closes a *modal* `<dialog>` on it — a
	 * non-modal one ignores the key entirely, which would leave a `non-modal` sheet with no keyboard exit. */
	private wireNative(): void {
		if (!this.rootWired) {
			this.rootWired = true;
			this.root.addEventListener("click", (event) => {
				if (event.target === this.dialogEl) this.close();
			});
			this.root.addEventListener("pointerdown", (event) => this.onPointerDown(event as PointerEvent));
			this.root.addEventListener("pointermove", (event) => this.onPointerMove(event as PointerEvent));
			this.root.addEventListener("pointerup", (event) => this.onPointerEnd(event as PointerEvent));
			this.root.addEventListener("pointercancel", (event) => this.onPointerEnd(event as PointerEvent));
		}
		const dialog = this.dialogEl;
		if (!dialog || dialog === this.wiredDialog) return;
		this.wiredDialog = dialog;
		dialog.addEventListener("keydown", (event) => {
			if (!this.nonModal || (event as KeyboardEvent).key !== "Escape") return;
			event.preventDefault();
			this.dispatchEvent(new Event("cancel", { bubbles: true, composed: true }));
			this.close();
		});
		dialog.addEventListener("close", () => {
			if (this.open) this.open = false;
			this.drag = null;
			this.clearDrag();
			this.restoreFromPortal();
			this.dispatchEvent(new Event("close", { bubbles: true, composed: true }));
		});
		dialog.addEventListener("cancel", () => {
			this.dispatchEvent(new Event("cancel", { bubbles: true, composed: true }));
		});
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(sheetHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
		this.wireNative();
		this.warnIfUnnamed();
		this.syncOpen();
	}
}

define("xtyle-sheet", XtyleSheet);

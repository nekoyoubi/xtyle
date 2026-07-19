import { AnchorTracker } from "./anchor-tracker.js";
import { XtyleElement, define, type StyleMode } from "./base.js";
import { placeOverlay, tooltipTetherShift } from "./overlay-position.js";
import { tooltipHostCss, type TooltipPlacement } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/tooltip/source.generated.js";
import { resolveOptionalTone, resolveVocab, TOOLTIP_PLACEMENTS } from "../vocab.js";

type Placement = TooltipPlacement;

const HIDE_DELAY = 100;

export class XtyleTooltip extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private contentId = `xtyle-tooltip-${Math.random().toString(36).slice(2, 8)}`;
	private hideTimer = 0;
	private wiredTriggers = new Set<HTMLElement>();
	private wiredContent: HTMLElement | null = null;
	private tracker = new AnchorTracker(() => this.reposition());
	private boundWhileOpen = false;
	/** True while `open` is the author's, not ours — see `hide()`. */
	private forcedOpen = false;
	/** Set around our own `open` writes so `attributeChangedCallback` can tell them from the author's. */
	private selfDriven = false;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "tooltip", {
		applyIntent: () => {},
	});

	static get observedAttributes(): string[] {
		return ["text", "placement", "open", "tone", "variant", "mode", "size"];
	}

	get text(): string | null {
		return this.getAttribute("text");
	}
	set text(value: string) {
		this.setAttribute("text", value);
	}

	get placement(): Placement {
		return resolveVocab(this.getAttribute("placement"), TOOLTIP_PLACEMENTS, "top", "tooltip placement");
	}
	set placement(value: Placement) {
		this.setAttribute("placement", value);
	}

	get tone(): string | null {
		return resolveOptionalTone(this.getAttribute("tone"));
	}
	set tone(value: string) {
		this.setAttribute("tone", value);
	}

	get variant(): string | null {
		return this.getAttribute("variant");
	}
	set variant(value: string) {
		this.setAttribute("variant", value);
	}

	get mode(): string | null {
		return this.getAttribute("mode");
	}
	set mode(value: string) {
		this.setAttribute("mode", value);
	}

	get size(): string | null {
		return this.getAttribute("size");
	}
	set size(value: string) {
		this.setAttribute("size", value);
	}

	get open(): boolean {
		return this.hasAttribute("open");
	}
	set open(value: boolean) {
		this.reflectBoolean("open", value);
	}

	private get triggerSlot(): HTMLSlotElement | null {
		return this.root.querySelector("slot:not([name])");
	}

	private get content(): HTMLElement | null {
		return this.root.querySelector(".xtyle-tooltip__content");
	}

	attributeChangedCallback(name: string): void {
		// Ahead of the render guard: an authored `open` arrives at upgrade, before there is a scaffold
		// to sync, and it is the only signal that the author — not a hover — asked for the tip.
		if (name === "open" && !this.selfDriven) this.forcedOpen = this.open;
		if (!this.root.firstChild) return;
		if (name === "open") {
			this.syncOpen();
			return;
		}
		this.render();
	}

	/** Drive `open` as our own state, so the author's `forcedOpen` survives the round trip. */
	private setOpen(next: boolean): void {
		this.selfDriven = true;
		this.open = next;
		this.selfDriven = false;
	}

	private get bindings(): Record<string, unknown> {
		return {
			text: this.text,
			placement: this.placement,
			contentId: this.contentId,
			open: this.open,
			tone: this.tone,
			variant: this.variant,
			mode: this.mode,
			size: this.size,
		};
	}

	/** Structural state ops can't patch incrementally: whether the tip body is bound `text` or a
	 * `content` slot. A change here rebuilds; placement and `open` are cheap `setAttr` patches. */
	private shapeSignature(): string {
		return `${this.text != null}`;
	}

	/** The trigger element(s) wrapped by the tooltip. In shadow DOM the trigger is projected through
	 * the default `<slot>`, so read its `assignedElements`. In light DOM the scaffold's `<slot>` was
	 * replaced by the trigger at compose time, so it's a direct child of `[data-root]` — every element
	 * child except the content panel. */
	private triggerEls(): HTMLElement[] {
		const slot = this.triggerSlot;
		if (slot) {
			return slot.assignedElements({ flatten: true }).filter((el): el is HTMLElement => el instanceof HTMLElement);
		}
		const root = this.root.querySelector("[data-root]");
		if (!root) return [];
		// The content panel is the trigger's sibling; non-rendering nodes (a binding's hydration
		// `<script>`, a `<style>`, etc.) can ride along in the composed slot and have no box — anchoring
		// to one collapses placement to a zero rect, so keep only real, layout-bearing trigger elements.
		const nonVisual = new Set(["SCRIPT", "STYLE", "TEMPLATE", "LINK"]);
		return [...root.children].filter(
			(el): el is HTMLElement =>
				el instanceof HTMLElement && !el.hasAttribute("data-content") && !nonVisual.has(el.tagName),
		);
	}

	private show = (): void => {
		window.clearTimeout(this.hideTimer);
		this.setOpen(true);
		this.reposition();
	};

	/**
	 * The gap between the tip and its trigger, measured off the arrow rather than hardcoded: both are
	 * `--space-2`, so a theme that scales its space scale keeps them agreeing. It has to be a number
	 * here — the tip is placed from viewport coordinates now, so a CSS margin would be an offset the
	 * flip math couldn't see, which is exactly how the old model let the two drift apart.
	 */
	private gapPx(): number {
		const arrow = this.content?.querySelector<HTMLElement>(".xtyle-tooltip__arrow");
		const measured = arrow?.offsetWidth ?? 0;
		return measured > 0 ? measured : 8;
	}

	/** Flip to the placement that fits the viewport, then clamp the cross-axis so the tip never
	 * spills past a viewport edge, and counter-shift the arrow via `--xtyle-tt-arrow` so it keeps
	 * pointing at the anchor through the clamp.
	 *
	 * The tip lives in the top layer, whose containing block is the viewport, so `placeOverlay`'s
	 * coordinates are written straight onto the element. That is the whole point of the promotion:
	 * nothing between the tip and the viewport can crop it, so a scrolling rail can keep its
	 * `overflow` and the tip still escapes. It also means placement is JS-only — with no script the
	 * tip never opens, which was already true (visibility has always been script-driven). */
	private reposition(): void {
		const trigger = this.triggerEls()[0];
		const content = this.content;
		const root = this.root.querySelector<HTMLElement>("[data-root]");
		if (!trigger || !content || !root) return;
		const anchor = trigger.getBoundingClientRect();
		const size = { width: content.offsetWidth, height: content.offsetHeight };
		const placed = placeOverlay({
			anchor,
			content: size,
			viewport: { width: window.innerWidth, height: window.innerHeight },
			preferred: this.placement,
			align: "center",
			gap: this.gapPx(),
		});
		for (const side of ["top", "bottom", "left", "right"]) root.classList.remove(`xtyle-tooltip--${side}`);
		root.classList.add(`xtyle-tooltip--${placed.placement}`);
		const shift = tooltipTetherShift({
			placement: placed.placement,
			placedLeft: placed.left,
			placedTop: placed.top,
			anchor,
			content: size,
		});
		// `shift.content` is the clamp the placement already applied; position carries it now, so only
		// the arrow's counter-shift is left to hand to CSS.
		content.style.left = `${placed.left}px`;
		content.style.top = `${placed.top}px`;
		content.style.setProperty("--xtyle-tt-arrow", `${shift.arrow}px`);
	}

	/** A pinned tip's "open time" is hydration, so it is placed against a trigger that may not have been
	 * scrolled into view yet — `AnchorTracker` is what keeps it honest afterwards. Escape shares the
	 * lifetime for the same reason it has to reach the document at all: both are concerns of an open
	 * tip that the tip's own subtree can't observe. */
	private bindWhileOpen(): void {
		if (this.boundWhileOpen) return;
		this.boundWhileOpen = true;
		this.tracker.start(this.triggerEls()[0], this.content);
		document.addEventListener("keydown", this.onKeydown, { capture: true });
	}

	private unbindWhileOpen(): void {
		if (!this.boundWhileOpen) return;
		this.boundWhileOpen = false;
		this.tracker.stop();
		document.removeEventListener("keydown", this.onKeydown, { capture: true });
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.unbindWhileOpen();
		window.clearTimeout(this.hideTimer);
	}

	private scheduleHide = (): void => {
		window.clearTimeout(this.hideTimer);
		this.hideTimer = window.setTimeout(() => this.hide(), HIDE_DELAY);
	};

	/** `open` is documented as settable "to force the hint open", so a pointer leaving the trigger — or
	 * an Escape — must not take the author's tip away. Only a tip we opened is ours to close. */
	private hide = (): void => {
		window.clearTimeout(this.hideTimer);
		if (this.forcedOpen) return;
		this.setOpen(false);
	};

	/** `manual` popovers get no Escape from the platform, and WCAG 1.4.13 wants hover content
	 * dismissible *without moving pointer or focus* — so the key never lands on the trigger, and a
	 * listener on the host only ever caught the focus case. The document sees it wherever focus is;
	 * the tip swallows the key only when it actually closed on it, leaving an unrelated Escape alone. */
	private onKeydown = (event: KeyboardEvent): void => {
		if (event.key !== "Escape" || !this.open || this.forcedOpen) return;
		event.stopPropagation();
		this.hide();
	};

	/**
	 * Drive the tip's popover. `showPopover()` throws if the element isn't in a state to take it —
	 * mid-rebuild, or already showing — so the call is guarded on `:popover-open` and swallowed;
	 * a tip that fails to open is not worth an exception in a hover handler.
	 *
	 * `data-open` stays on the node as the state a fill can read and style against, but it no longer
	 * drives visibility: the platform does, off `:popover-open`.
	 */
	private syncOpen(): void {
		const content = this.content;
		if (!content) return;
		content.setAttribute("data-open", String(this.open));
		const shown = content.matches(":popover-open");
		try {
			if (this.open && !shown) {
				content.showPopover();
				// Placement is JS-only now, so every path that opens the tip has to place it — not just
				// the hover. A tip opened declaratively (`open` on the element, the always-on case) never
				// passes through `show()`, and an unplaced fixed popover renders at the viewport corner.
				this.reposition();
				this.bindWhileOpen();
			} else if (!this.open && shown) {
				this.unbindWhileOpen();
				content.hidePopover();
			}
		} catch {
			/* not in a state to take it; the next hover will try again */
		}
	}

	/** Wire the trigger and content listeners the fragment scaffold can't express as shadow-DOM
	 * handlers: hover/focus on the slotted light-DOM trigger and on the content panel itself. Guarded
	 * per element so re-renders don't double-bind; a remount-rebuilt content panel re-attaches. */
	private wireTriggers(): void {
		for (const el of this.triggerEls()) {
			if (this.wiredTriggers.has(el)) continue;
			this.wiredTriggers.add(el);
			el.setAttribute("aria-describedby", this.contentId);
			el.addEventListener("pointerenter", this.show);
			el.addEventListener("pointerleave", this.scheduleHide);
			el.addEventListener("focusin", this.show);
			el.addEventListener("focusout", this.scheduleHide);
		}
		const content = this.content;
		if (content && content !== this.wiredContent) {
			this.wiredContent = content;
			content.addEventListener("pointerenter", this.show);
			content.addEventListener("pointerleave", this.scheduleHide);
		}
	}

	/** A tip is "empty" only when it has neither bound `text` nor `content`. Read the live panel rather
	 * than `[slot="content"]` — SSR composition strips the `slot` attribute as it folds the content in,
	 * so the attribute check would false-warn on every composed content tooltip. Anything in the panel
	 * beyond the arrow and the (empty) bound-text node counts as content. */
	private warnIfEmpty(): void {
		if (this.text) return;
		const content = this.content;
		const hasContent =
			!!content &&
			[...content.childNodes].some((node) =>
				node instanceof Element
					? !node.classList.contains("xtyle-tooltip__arrow") && !node.hasAttribute("data-label")
					: (node.textContent ?? "").trim() !== "",
			);
		if (!hasContent) {
			console.warn(
				"xtyle-tooltip: no tip text. Provide a `text` attribute or a `content` slot so the tooltip describes its trigger.",
			);
		}
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(tooltipHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
		this.wireTriggers();
		this.warnIfEmpty();
		this.syncOpen();
	}
}

define("xtyle-tooltip", XtyleTooltip);

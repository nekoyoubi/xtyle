import { XojiElement, define, type StyleMode } from "./base.js";
import { placeOverlay, tooltipTetherShift } from "./overlay-position.js";
import { tooltipHostCss, type TooltipPlacement } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/tooltip/source.generated.js";

type Placement = TooltipPlacement;

const HIDE_DELAY = 100;

export class XojiTooltip extends XojiElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private contentId = `xoji-tooltip-${Math.random().toString(36).slice(2, 8)}`;
	private hideTimer = 0;
	private wiredTriggers = new Set<HTMLElement>();
	private wiredContent: HTMLElement | null = null;
	private rootWired = false;
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
		return (this.getAttribute("placement") as Placement) ?? "top";
	}
	set placement(value: Placement) {
		this.setAttribute("placement", value);
	}

	get tone(): string | null {
		return this.getAttribute("tone");
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
		return this.root.querySelector(".xoji-tooltip__content");
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
		this.reposition();
		this.open = true;
	};

	/** Flip to the placement that fits the viewport, then clamp the cross-axis so the tip never
	 * spills past a viewport edge — shifting the content via `--xoji-tt-shift` and counter-shifting
	 * the arrow via `--xoji-tt-arrow` so it keeps pointing at the anchor. Keeps the CSS-absolute
	 * model and the arrow (the chosen side's modifier class drives both); with the vars unset the
	 * scaffold's centered no-JS/SSR layout is unchanged. */
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
			gap: 8,
		});
		for (const side of ["top", "bottom", "left", "right"]) root.classList.remove(`xoji-tooltip--${side}`);
		root.classList.add(`xoji-tooltip--${placed.placement}`);
		const shift = tooltipTetherShift({
			placement: placed.placement,
			placedLeft: placed.left,
			placedTop: placed.top,
			anchor,
			content: size,
		});
		content.style.setProperty("--xoji-tt-shift", `${shift.content}px`);
		content.style.setProperty("--xoji-tt-arrow", `${shift.arrow}px`);
	}

	private scheduleHide = (): void => {
		window.clearTimeout(this.hideTimer);
		this.hideTimer = window.setTimeout(() => this.hide(), HIDE_DELAY);
	};

	private hide = (): void => {
		window.clearTimeout(this.hideTimer);
		this.open = false;
	};

	private onKeydown = (event: KeyboardEvent): void => {
		if (event.key === "Escape" && this.open) {
			event.stopPropagation();
			this.hide();
		}
	};

	private syncOpen(): void {
		const content = this.content;
		if (content) content.setAttribute("data-open", String(this.open));
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
		if (!this.rootWired) {
			this.rootWired = true;
			this.addEventListener("keydown", this.onKeydown);
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
					? !node.classList.contains("xoji-tooltip__arrow") && !node.hasAttribute("data-text")
					: (node.textContent ?? "").trim() !== "",
			);
		if (!hasContent) {
			console.warn(
				"xoji-tooltip: no tip text. Provide a `text` attribute or a `content` slot so the tooltip describes its trigger.",
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

define("xoji-tooltip", XojiTooltip);

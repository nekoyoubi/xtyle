import { XtyleElement, define, type StyleMode } from "./base.js";
import {
	cutoutPath,
	spotlightHostCss,
	type SpotlightArrow,
	type SpotlightPulse,
	type SpotlightRect,
	type SpotlightShape,
} from "../markup/spotlight.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/spotlight/source.generated.js";
// the callout floats in a real <xtyle-popover> the fill declares, so the tag has to be defined
import "./popover.js";
import type { XtylePopover } from "./popover.js";
import type { OverlayPlacement } from "./overlay-position.js";

export type { SpotlightShape, SpotlightArrow, SpotlightPulse } from "../markup/spotlight.js";

let spotlightSeq = 0;

/**
 * Isolate one thing on the page and say something about it: everything but the target dims (and, if asked,
 * blurs), a hole is cut over it, and a callout floats beside it. The coachmark half of onboarding — a Tour
 * is a Spotlight with more than one step.
 *
 * The isolation is a single clipped veil rather than four boxes around the target, so the hole can have real
 * corner radii (or be a circle) and the target underneath stays *live*: the veil takes pointer events, the
 * hole doesn't, so the thing you are pointing at is still the thing the user can click. That is the whole
 * difference between a spotlight and a screenshot with a circle drawn on it.
 *
 * The callout is a real `<xtyle-popover>`, so the placement, the flipping, the arrow, and the focus handling
 * are the ones already proven there; what this element adds is the veil, the ring, and the geometry that
 * keeps them glued to a target that scrolls, resizes, or moves.
 *
 * Fragment-backed: the veil, the ring, the callout panel, the pointer and the dismiss button render through
 * `component.spotlight`, so a mod can reshape any of it.
 */
export class XtyleSpotlight extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private uid = `xtyle-spotlight-${spotlightSeq++}`;
	private targetEl: HTMLElement | null = null;
	private rect: SpotlightRect | null = null;
	private tracking = false;
	private frame = 0;
	/** The last state announced, so `open` / `close` mark the transition rather than every paint that
	 * happens to find the spotlight open. */
	private announced = false;
	private wiredCallout: XtylePopover | null = null;
	/** The target the callout is currently anchored to, so a Tour re-pointing the spotlight at a new
	 * element re-anchors the callout instead of leaving it where the first step opened it. */
	private calloutTarget: HTMLElement | null = null;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "spotlight", {
		applyIntent: (intent, event) => this.applyIntent(intent, event),
		afterApply: () => {
			this.wireCallout();
			this.syncCallout();
		},
	});

	static get observedAttributes(): string[] {
		return [
			"open",
			"target",
			"padding",
			"radius",
			"shape",
			"dim",
			"blur",
			"placement",
			"heading",
			"arrow",
			"pulse",
			"close-label",
			"no-close-button",
			"no-dismiss",
			"scroll-into-view",
		];
	}

	get open(): boolean {
		return this.hasAttribute("open");
	}
	set open(value: boolean) {
		this.reflectBoolean("open", value);
	}

	/** What to isolate: a CSS selector, or an element handed over directly through `targetElement`. */
	get target(): string | null {
		return this.getAttribute("target");
	}
	set target(value: string | null | undefined) {
		this.reflectString("target", value);
	}

	/** The element under the hole. Set it to point the spotlight at a node no selector can name. */
	get targetElement(): HTMLElement | null {
		return this.targetEl ?? this.resolveTarget();
	}
	set targetElement(value: HTMLElement | null) {
		this.targetEl = value;
		this.measure();
	}

	get shape(): SpotlightShape {
		return (this.getAttribute("shape") as SpotlightShape) ?? "auto";
	}
	set shape(value: SpotlightShape) {
		this.setAttribute("shape", value);
	}

	/** Whether the ring pulses, and how fast. `slow` (the default cadence) or `fast`; both stop under
	 * `prefers-reduced-motion`. A bare `pulse` attribute reads as `slow`. */
	get pulse(): SpotlightPulse {
		if (!this.hasAttribute("pulse")) return "none";
		const value = this.getAttribute("pulse");
		return value === "fast" ? "fast" : "slow";
	}
	set pulse(value: SpotlightPulse | boolean) {
		if (value === false || value === "none") this.removeAttribute("pulse");
		else this.setAttribute("pulse", value === true ? "slow" : value);
	}

	/** How the callout's pointer behaves. `bounce` animates it toward the target, and stills under `prefers-reduced-motion`. */
	get arrow(): SpotlightArrow {
		return (this.getAttribute("arrow") as SpotlightArrow) ?? "bounce";
	}
	set arrow(value: SpotlightArrow) {
		this.setAttribute("arrow", value);
	}

	get padding(): number {
		return this.numberAttr("padding", 8);
	}
	set padding(value: number) {
		this.setAttribute("padding", String(value));
	}

	/** Whether a click on the veil (or Escape) closes the spotlight. */
	get noDismiss(): boolean {
		return this.hasAttribute("no-dismiss");
	}
	set noDismiss(value: boolean) {
		this.reflectBoolean("no-dismiss", value);
	}

	private numberAttr(name: string, fallback: number): number {
		const raw = this.getAttribute(name);
		if (raw === null) return fallback;
		const value = Number(raw);
		return Number.isFinite(value) ? value : fallback;
	}

	private get callout(): XtylePopover | null {
		return this.root.querySelector("[data-callout]");
	}

	show(): void {
		this.open = true;
	}

	close(): void {
		this.open = false;
	}

	attributeChangedCallback(name: string): void {
		if (!this.root.firstChild) return;
		if (name === "dim" || name === "blur") {
			this.repaint();
			return;
		}
		if (name === "open") {
			this.syncOpen();
			return;
		}
		if (name === "target") this.targetEl = null;
		this.measure();
	}

	override connectedCallback(): void {
		super.connectedCallback();
		if (this.open) this.syncOpen();
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.stopTracking();
		this.wiredCallout?.removeEventListener("open", this.muffle);
		this.wiredCallout?.removeEventListener("close", this.muffle);
		this.wiredCallout = null;
	}

	/** The element the hole is cut over. A selector that names nothing yields no hole, and the veil goes
	 * solid — a spotlight on nothing is a scrim, which is honest; a hole at 0,0 is a bug. */
	private resolveTarget(): HTMLElement | null {
		const selector = this.target;
		if (!selector) return null;
		const root = this.getRootNode();
		const scope = root instanceof ShadowRoot || root instanceof Document ? root : document;
		return scope.querySelector<HTMLElement>(selector);
	}

	/** The target's own corner radius, so an `auto` hole traces the thing rather than a guess at it. */
	private targetRadius(el: HTMLElement): number {
		if (this.shape !== "auto") return this.numberAttr("radius", 0);
		const declared = this.getAttribute("radius");
		if (declared !== null) return this.numberAttr("radius", 0);
		const raw = getComputedStyle(el).borderTopLeftRadius;
		const value = Number.parseFloat(raw);
		return Number.isFinite(value) ? value : 0;
	}

	private measure(): void {
		const el = this.targetEl ?? this.resolveTarget();
		this.targetEl = el;
		if (!el || typeof window === "undefined") {
			this.rect = null;
			this.repaint();
			return;
		}
		const box = el.getBoundingClientRect();
		this.rect = { top: box.top, left: box.left, width: box.width, height: box.height };
		this.repaint();
		// re-anchor when the target itself changed (a Tour stepping to a new element), reposition when it
		// only moved (scroll, resize). Routed through here because a target swap runs measure but does not
		// change the `open` attribute, so the callout would otherwise stay where the first step opened it.
		this.syncCallout();
	}

	private repaint(): void {
		if (this.root.firstChild) this.fragment.update(this.bindings);
	}

	/** Follow the target through anything that can move it: a scroll, a resize, a layout settling in. The
	 * veil is fixed to the viewport, so a target that scrolls under an unfollowed hole is the single most
	 * obvious way this component can look broken. */
	private startTracking(): void {
		if (this.tracking || typeof window === "undefined") return;
		this.tracking = true;
		window.addEventListener("scroll", this.onViewportChange, { passive: true, capture: true });
		window.addEventListener("resize", this.onViewportChange, { passive: true });
	}

	private stopTracking(): void {
		if (!this.tracking || typeof window === "undefined") return;
		this.tracking = false;
		window.removeEventListener("scroll", this.onViewportChange, { capture: true });
		window.removeEventListener("resize", this.onViewportChange);
		if (this.frame) cancelAnimationFrame(this.frame);
		this.frame = 0;
	}

	private onViewportChange = (): void => {
		if (this.frame) return;
		this.frame = requestAnimationFrame(() => {
			this.frame = 0;
			this.measure();
		});
	};

	private get viewport(): SpotlightRect {
		const width = typeof window === "undefined" ? 0 : window.innerWidth;
		const height = typeof window === "undefined" ? 0 : window.innerHeight;
		return { top: 0, left: 0, width, height };
	}

	/**
	 * The ring traces the hole, so it is measured from the same numbers the cut is — never from the target's
	 * raw box with a border-radius thrown at it. A circle cut around a wide target is a *circle*; a ring that
	 * takes the target's box and rounds it to 50% is an ellipse, and the two disagree the moment the target
	 * is anything but square.
	 */
	private ringBox(rect: SpotlightRect, padding: number): SpotlightRect {
		const padded = {
			top: rect.top - padding,
			left: rect.left - padding,
			width: rect.width + padding * 2,
			height: rect.height + padding * 2,
		};
		if (this.shape !== "circle") return padded;
		const diameter = Math.max(padded.width, padded.height);
		return {
			top: padded.top + padded.height / 2 - diameter / 2,
			left: padded.left + padded.width / 2 - diameter / 2,
			width: diameter,
			height: diameter,
		};
	}

	private get bindings(): Record<string, unknown> {
		const rect = this.rect;
		const padding = this.padding;
		const radius = this.targetEl ? this.targetRadius(this.targetEl) : 0;
		const cutout = cutoutPath(rect, this.viewport, { padding, radius, shape: this.shape });
		const ring = rect ? this.ringBox(rect, padding) : null;
		const ringStyle = ring
			? `top: ${ring.top}px; left: ${ring.left}px; width: ${ring.width}px; height: ${ring.height}px; border-radius: ${this.shape === "circle" ? "50%" : `${radius}px`};`
			: "display: none;";
		const pointerStyle = rect
			? `top: ${rect.top - padding}px; left: ${rect.left + rect.width / 2}px;`
			: "display: none;";
		const dim = this.getAttribute("dim");
		const blur = this.getAttribute("blur");
		return {
			open: this.open,
			heading: this.getAttribute("heading"),
			closeLabel: this.getAttribute("close-label"),
			noCloseButton: this.hasAttribute("no-close-button"),
			arrow: this.arrow,
			pulse: this.pulse,
			cutout,
			// the dim/blur knobs ride *in the same veil style string as the cutout*: the fill sets the veil's
			// whole `style` attribute for the clip path, so a separate write of these would be wiped on the
			// next paint. They are values a mod would change, not structure — passed as bindings, composed by
			// the fill, overriding the CSS default inline on the veil.
			dim: dim,
			blur: blur === null ? null : `${Number(blur) || 0}px`,
			ringStyle,
			pointerStyle,
			showPointer: this.arrow !== "none" && rect !== null,
			headingId: `${this.uid}-heading`,
		};
	}

	private applyIntent(intent: FragmentIntent, event: Event): void {
		if (intent.preventDefault) event.preventDefault();
		if (intent.stopPropagation) event.stopPropagation();
		if (intent.requestClose) this.dismiss();
	}

	/** The user asked to leave. `no-dismiss` makes the veil and Escape inert, for a step the app insists on. */
	private dismiss(): void {
		if (this.noDismiss) return;
		this.close();
		this.dispatchEvent(new Event("dismiss", { bubbles: true, composed: true }));
	}

	private syncOpen(): void {
		const open = this.open;
		if (open) {
			this.measure();
			this.startTracking();
			if (this.hasAttribute("scroll-into-view")) {
				this.targetEl?.scrollIntoView?.({ block: "center", behavior: "smooth" });
			}
			this.repaint();
			this.syncCallout();
		} else {
			this.stopTracking();
			this.callout?.hide("api", false);
			this.repaint();
		}
		if (open === this.announced) return;
		this.announced = open;
		this.dispatchEvent(new Event(open ? "open" : "close", { bubbles: true, composed: true }));
	}

	/**
	 * The callout is a Popover, and a Popover announces itself: it fires its own bubbling, composed `open`
	 * and `close`. Left alone those escape this element and land on a consumer listening for the *spotlight's*
	 * open and close, so every step would announce itself twice and a `close` would arrive from a panel the
	 * app never opened. The spotlight speaks for itself; its callout does not get a second voice.
	 */
	private wireCallout(): void {
		const callout = this.callout;
		if (!callout || callout === this.wiredCallout) return;
		this.wiredCallout = callout;
		callout.addEventListener("open", this.muffle);
		callout.addEventListener("close", this.muffle);
	}

	/**
	 * The callout is a Popover, and a Popover announces itself with its own bubbling, composed `open`/`close`.
	 * Left alone those escape this element and double the spotlight's — a `close` arriving from a panel the app
	 * never opened. The spotlight speaks for itself; its callout does not get a second voice. (The callout is a
	 * `no-light-dismiss` popover, so it never closes on its own — only the spotlight closes it — which is why a
	 * veil click on an unclosable step no longer flickers the callout shut and open again.)
	 */
	private muffle = (event: Event): void => {
		event.stopPropagation();
	};

	/** Open the callout against the target — never against the spotlight host, which is `display: contents`
	 * and has no box to anchor to. */
	private syncCallout(): void {
		const callout = this.callout;
		const target = this.targetEl;
		if (!callout) return;
		if (!this.open || !target) {
			if (callout.open) callout.hide("api", false);
			this.calloutTarget = null;
			return;
		}
		// already anchored to this exact target — a plain reposition (from scroll/resize) handles the rest
		if (callout.open && this.calloutTarget === target) {
			callout.reposition();
			return;
		}
		const placement = (this.getAttribute("placement") as OverlayPlacement | null) ?? "bottom";
		this.calloutTarget = target;
		callout.reanchor(target, { placement, gap: this.padding + 12, focus: "first" });
	}

	/** Escape leaves, unless the app said this step is not optional. The veil is not focusable, so the key
	 * is caught on the host rather than on the panel the platform would hand it to. */
	private onKeydown = (event: KeyboardEvent): void => {
		if (!this.open || event.key !== "Escape") return;
		event.preventDefault();
		event.stopPropagation();
		this.dismiss();
	};

	protected template(): string {
		return "";
	}


	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(spotlightHostCss);
		this.measure();
		this.fragment.update(this.bindings);
		this.addEventListener("keydown", this.onKeydown);
		if (this.open) this.syncOpen();
	}
}

define("xtyle-spotlight", XtyleSpotlight);

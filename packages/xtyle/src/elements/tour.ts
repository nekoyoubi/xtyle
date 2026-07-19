import { XtyleElement, XtyleDecoratorElement, define, type StyleMode } from "./base.js";
import { tourHostCss, type TourProgress } from "../markup/tour.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/tour/source.generated.js";
// the tour drives a real <xtyle-spotlight> (and, through it, <xtyle-popover>), so the tags must be defined
import "./spotlight.js";
import type { XtyleSpotlight } from "./spotlight.js";

export type { TourProgress } from "../markup/tour.js";

let tourSeq = 0;

/**
 * One step of a Tour: what to point at (`target`) and, in its content, what to say about it. Every
 * spotlight knob — `heading`, `placement`, `shape`, `padding`, `radius`, `pulse`, `arrow`, `dim`,
 * `blur`, `no-dismiss` — can be set here to override the Tour's own default for this step alone. It
 * renders nothing itself; the Tour projects the current step's content into the spotlight's callout.
 */
export class XtyleTourStep extends XtyleDecoratorElement {}
define("xtyle-tour-step", XtyleTourStep);

/**
 * A guided sequence of Spotlights: point at one thing, say something, move to the next. A Tour is a
 * Spotlight with more than one step, and the step-to-step focus handling — the part that goes wrong
 * when it's hand-rolled — is the spotlight's, proven there.
 *
 * The Tour owns the sequence (which step, next / back / skip / done, the progress readout) and drives
 * a single composed `<xtyle-spotlight>` through it: it resolves each step's `target` against the page
 * and hands the element over directly, so a selector still finds a node the tour's own shadow can't
 * see. The isolation — the veil, the ring, the callout — is the spotlight's; the only chrome the Tour
 * invents is the nav row, which renders through `component.tour`, so a mod can reshape it.
 */
export class XtyleTour extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private uid = `xtyle-tour-${tourSeq++}`;
	private index = 0;
	private running = false;
	private wiredSpotlight: XtyleSpotlight | null = null;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "tour", {
		applyIntent: (intent, event) => this.applyIntent(intent, event),
		afterApply: () => {
			this.wireSpotlight();
			this.syncSpotlight();
		},
	});

	static get observedAttributes(): string[] {
		return [
			"open",
			"index",
			"progress",
			"back-label",
			"next-label",
			"done-label",
			"skip-label",
			"no-skip",
			"placement",
			"shape",
			"padding",
			"dim",
			"blur",
			"pulse",
			"arrow",
			"scroll-into-view",
			"no-dismiss",
		];
	}

	get open(): boolean {
		return this.hasAttribute("open");
	}
	set open(value: boolean) {
		this.reflectBoolean("open", value);
	}

	get progress(): TourProgress {
		const value = this.getAttribute("progress");
		return value === "dots" || value === "none" ? value : "count";
	}
	set progress(value: TourProgress) {
		this.setAttribute("progress", value);
	}

	/** The steps, read live from the `<xtyle-tour-step>` children. */
	get steps(): HTMLElement[] {
		return (Array.from(this.children) as HTMLElement[]).filter((el) => el.tagName === "XTYLE-TOUR-STEP");
	}

	/** The step showing now, zero-based. */
	get currentIndex(): number {
		return this.index;
	}

	private get spotlightEl(): XtyleSpotlight | null {
		return this.root.querySelector("[data-tour-spotlight]");
	}

	/** Open the tour at a step (the first by default). */
	start(index = 0): void {
		this.index = this.clamp(index);
		this.running = true;
		this.reflectBoolean("open", true);
		this.applyStep(true);
	}

	/** Advance a step, or finish if this was the last. */
	next(): void {
		if (this.index >= this.steps.length - 1) {
			this.finish();
			return;
		}
		this.index++;
		this.applyStep();
	}

	/** Step back, unless already at the first. */
	back(): void {
		if (this.index <= 0) return;
		this.index--;
		this.applyStep();
	}

	/** Jump to a specific step. */
	go(index: number): void {
		this.index = this.clamp(index);
		this.applyStep();
	}

	/** End on the last step: closes and announces `complete`. */
	finish(): void {
		this.teardown();
		this.emit("complete", { index: this.index, total: this.steps.length });
		this.emit("close");
	}

	/** End early at the user's request: closes and announces `skip`. */
	skip(): void {
		this.teardown();
		this.emit("skip", { index: this.index, total: this.steps.length });
		this.emit("close");
	}

	/** Close without either verdict. */
	close(): void {
		this.teardown();
		this.emit("close");
	}

	private teardown(): void {
		this.running = false;
		this.removeAttribute("open");
		this.repaint();
		this.syncSpotlight();
	}

	private clamp(index: number): number {
		const count = this.steps.length;
		if (count === 0) return 0;
		return Math.max(0, Math.min(index, count - 1));
	}

	private applyStep(started = false): void {
		this.index = this.clamp(this.index);
		const steps = this.steps;
		steps.forEach((step, i) => {
			step.hidden = i !== this.index;
		});
		this.repaint();
		this.syncSpotlight();
		if (started) this.emit("start", { index: this.index, total: steps.length });
		this.emit("step", { index: this.index, total: steps.length });
	}

	private repaint(): void {
		if (this.root.firstChild) this.fragment.update(this.bindings);
	}

	private get bindings(): Record<string, unknown> {
		const count = this.steps.length;
		const isLast = this.index >= count - 1;
		return {
			open: this.running,
			backLabel: this.getAttribute("back-label") ?? "Back",
			nextLabel: isLast ? (this.getAttribute("done-label") ?? "Done") : (this.getAttribute("next-label") ?? "Next"),
			skipLabel: this.getAttribute("skip-label") ?? "Skip",
			showBack: this.index > 0,
			showSkip: !this.hasAttribute("no-skip") && !isLast,
			progress: this.progress,
			stepIndex: this.index,
			stepCount: count,
		};
	}

	/** Drive the composed spotlight to the current step, or close it when the tour isn't running. */
	private syncSpotlight(): void {
		const spot = this.spotlightEl;
		if (!spot) return;
		const step = this.steps[this.index] ?? null;
		if (!this.running || !step) {
			spot.removeAttribute("open");
			return;
		}
		const inherit = (name: string): string | null => step.getAttribute(name) ?? this.getAttribute(name);
		this.setSpot(spot, "heading", step.getAttribute("heading"));
		this.setSpot(spot, "placement", inherit("placement"));
		this.setSpot(spot, "shape", inherit("shape"));
		this.setSpot(spot, "padding", inherit("padding"));
		this.setSpot(spot, "radius", step.getAttribute("radius"));
		this.setSpot(spot, "pulse", inherit("pulse"));
		this.setSpot(spot, "arrow", inherit("arrow"));
		this.setSpot(spot, "dim", inherit("dim"));
		this.setSpot(spot, "blur", inherit("blur"));
		const scroll = step.hasAttribute("scroll-into-view") || this.hasAttribute("scroll-into-view");
		this.setSpot(spot, "scroll-into-view", scroll ? "" : null);
		const modal = step.hasAttribute("no-dismiss") || this.hasAttribute("no-dismiss");
		this.setSpot(spot, "no-dismiss", modal ? "" : null);
		// resolve the target ourselves: the selector must resolve against the page, not the tour's shadow
		spot.targetElement = this.resolveTarget(step.getAttribute("target"));
		spot.setAttribute("open", "");
	}

	private setSpot(spot: XtyleSpotlight, name: string, value: string | null): void {
		if (value == null) spot.removeAttribute(name);
		else spot.setAttribute(name, value);
	}

	private resolveTarget(selector: string | null): HTMLElement | null {
		if (!selector) return null;
		const root = this.getRootNode();
		const scope = root instanceof ShadowRoot || root instanceof Document ? root : document;
		return scope.querySelector<HTMLElement>(selector);
	}

	/** The spotlight is a Popover-backed element that announces its own open/close and a dismiss. The
	 * tour speaks for itself, so those are muffled; a veil click or Escape reads as the user opting out. */
	private wireSpotlight(): void {
		const spot = this.spotlightEl;
		if (!spot || spot === this.wiredSpotlight) return;
		this.wiredSpotlight = spot;
		spot.addEventListener("dismiss", this.onDismiss);
		spot.addEventListener("open", this.muffle);
		spot.addEventListener("close", this.muffle);
	}

	private onDismiss = (event: Event): void => {
		event.stopPropagation();
		if (this.running) this.skip();
	};

	private muffle = (event: Event): void => {
		event.stopPropagation();
	};

	private applyIntent(intent: FragmentIntent, event: Event): void {
		if (intent.stopPropagation) event.stopPropagation();
		if (intent.tourNav === "back") this.back();
		else if (intent.tourNav === "next") this.next();
		else if (intent.tourNav === "skip") this.skip();
	}

	private emit(type: string, detail?: unknown): void {
		this.dispatchEvent(
			detail === undefined
				? new Event(type, { bubbles: true, composed: true })
				: new CustomEvent(type, { detail, bubbles: true, composed: true }),
		);
	}

	override connectedCallback(): void {
		super.connectedCallback();
		const start = this.getAttribute("index");
		if (start != null) {
			const parsed = Number(start);
			if (Number.isInteger(parsed)) this.index = this.clamp(parsed);
		}
		if (this.open) this.start(this.index);
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.wiredSpotlight?.removeEventListener("dismiss", this.onDismiss);
		this.wiredSpotlight?.removeEventListener("open", this.muffle);
		this.wiredSpotlight?.removeEventListener("close", this.muffle);
		this.wiredSpotlight = null;
	}

	attributeChangedCallback(name: string): void {
		if (!this.root.firstChild) return;
		if (name === "open") {
			if (this.open && !this.running) this.start(this.index);
			else if (!this.open && this.running) this.close();
			return;
		}
		if (name === "index") {
			const parsed = Number(this.getAttribute("index"));
			if (Number.isInteger(parsed)) this.index = this.clamp(parsed);
			if (this.running) this.applyStep();
			return;
		}
		this.repaint();
		this.syncSpotlight();
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(tourHostCss);
		this.fragment.update(this.bindings);
	}
}

define("xtyle-tour", XtyleTour);

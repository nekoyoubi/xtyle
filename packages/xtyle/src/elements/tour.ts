import { XtyleElement, XtyleDecoratorElement, define, type StyleMode } from "./base.js";
import { tourHostCss, type TourProgress, type TourSpec } from "../markup/tour.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/tour/source.generated.js";
import "./spotlight.js";
import type { XtyleSpotlight } from "./spotlight.js";

function readSpec(value: unknown): TourSpec | null {
	const parsed: unknown = typeof value === "string" ? tryParse(value) : value;
	return Array.isArray((parsed as TourSpec | null)?.steps) ? (parsed as TourSpec) : null;
}

function tryParse(raw: string): unknown {
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

export type { TourProgress, TourSpec, TourStepSpec } from "../markup/tour.js";

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
	private stepToken = 0;
	private openedStep = -1;
	private beforeStepFn: ((index: number) => void | Promise<void>) | null = null;
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
			"taken",
			"spec",
			"placement",
			"shape",
			"padding",
			"dim",
			"blur",
			"pulse",
			"arrow",
			"scroll-into-view",
			"no-dismiss",
			"target-timeout",
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

	private specValue: TourSpec | null = null;

	/**
	 * A whole tour as data, in place of authoring `<xtyle-tour-step>` children by hand.
	 *
	 * It materializes those children rather than rendering a second way, so there is one step-reading
	 * path and a spec-driven tour behaves identically to a slotted one — the same split `tabs` and
	 * `accordion` already carry. Setting it replaces any steps the element had.
	 */
	get spec(): TourSpec | null {
		return this.specValue ?? readSpec(this.getAttribute("spec"));
	}
	set spec(value: TourSpec | string | null | undefined) {
		this.specValue = readSpec(value ?? null);
		this.materializeSpec();
	}

	/** Whether this tour has already been taken. The component reports `complete` and `skip` and holds no
	 * memory of either; where that is kept — and whether it survives a reload, a user, or a device — is
	 * the app's decision, so this is the app telling the component rather than the component guessing. */
	get taken(): boolean {
		return this.hasAttribute("taken");
	}
	set taken(value: boolean) {
		this.reflectBoolean("taken", value);
	}

	private materializeSpec(): void {
		const spec = this.spec;
		if (!spec) return;
		for (const existing of this.steps) existing.remove();
		for (const step of spec.steps) {
			const el = document.createElement("xtyle-tour-step");
			el.setAttribute("target", step.target);
			if (step.heading != null) el.setAttribute("heading", step.heading);
			if (step.placement != null) el.setAttribute("placement", step.placement);
			if (step.shape != null) el.setAttribute("shape", step.shape);
			if (step.padding != null) el.setAttribute("padding", String(step.padding));
			if (step.radius != null) el.setAttribute("radius", String(step.radius));
			if (step.scrollIntoView) el.setAttribute("scroll-into-view", "");
			if (step.noDismiss) el.setAttribute("no-dismiss", "");
			if (step.body != null) el.textContent = step.body;
			this.append(el);
		}
		this.openedStep = -1;
		if (this.root.firstChild) this.render();
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
		this.stepToken++;
		this.openedStep = -1;
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

	/**
	 * Run before a step's target is resolved, and awaited if it returns a promise — the seam for a step
	 * that has to *make* what it points at: open a panel, select a layer, switch a tool. Property only;
	 * it is a function.
	 */
	get beforeStep(): ((index: number) => void | Promise<void>) | null {
		return this.beforeStepFn;
	}
	set beforeStep(value: ((index: number) => void | Promise<void>) | null) {
		this.beforeStepFn = value;
	}

	/** How long to keep watching for a step's target after the callout is up, in ms. */
	get targetTimeout(): number {
		const raw = Number(this.getAttribute("target-timeout"));
		return Number.isFinite(raw) && this.hasAttribute("target-timeout") ? Math.max(0, raw) : 2000;
	}
	set targetTimeout(value: number) {
		this.reflectString("target-timeout", String(value));
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

		if (this.openedStep === this.index) return;
		this.openedStep = this.index;
		const selector = step.getAttribute("target");
		const token = ++this.stepToken;
		if (this.beforeStepFn) void this.prepareThenOpen(spot, selector, token);
		else this.openAt(spot, selector, token);
	}

	/** Let the step make its own target before anything measures for it, then open against the result. */
	private async prepareThenOpen(spot: XtyleSpotlight, selector: string | null, token: number): Promise<void> {
		try {
			await this.beforeStepFn?.(this.index);
		} catch (error) {
			console.error(`xtyle: a tour's beforeStep threw preparing step ${this.index}`, error);
		}
		if (token !== this.stepToken) return;
		this.openAt(spot, selector, token);
	}

	private openAt(spot: XtyleSpotlight, selector: string | null, token: number): void {
		spot.targetElement = this.resolveTarget(selector);
		spot.setAttribute("open", "");
		if (selector && !spot.targetElement) void this.attachWhenReady(spot, selector, token);
	}

	/**
	 * Keep looking for a step's target after the callout is already up.
	 *
	 * A tour points at things a step may have to create — a panel that opens, a tool that gets selected —
	 * and the target used to be resolved exactly once, on arrival, which is already too late to make one.
	 * A framework's own flush is enough to lose the race even when the target *is* prepared, which is why
	 * consumers were withholding the whole tour for a frame. The step still opens immediately with whatever
	 * resolves now, so nothing is delayed by waiting; the target simply attaches when it appears.
	 */
	private async attachWhenReady(spot: XtyleSpotlight, selector: string, token: number): Promise<void> {
		const deadline = this.now() + this.targetTimeout;
		while (token === this.stepToken && this.now() < deadline) {
			await this.nextFrame();
			if (token !== this.stepToken) return;
			const found = this.resolveTarget(selector);
			if (found) {
				spot.targetElement = found;
				return;
			}
		}
		if (token !== this.stepToken) return;
		this.emit("target-missing", { index: this.index, target: selector });
	}

	private now(): number {
		return typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : Date.now();
	}

	private nextFrame(): Promise<void> {
		return new Promise((resolve) => {
			if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => resolve());
			else setTimeout(resolve, 16);
		});
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
		if (name === "spec") {
			this.materializeSpec();
			return;
		}
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

import { XtyleElement, define, type StyleMode } from "./base.js";
import type { Size, FullTone } from "../index.js";
import { sliderHostCss } from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/slider/source.generated.js";

export class XtyleSlider extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static formAssociated = true;

	private internals: ElementInternals | null = null;
	private elementId = `xtyle-slider-${Math.random().toString(36).slice(2, 8)}`;
	private formatFn: ((value: number) => string) | null = null;
	private lastShape = "";
	private lastNamed = false;
	private hostWired = false;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "slider", {
		context: (handler) => (handler === "keyAdjust" ? this.keyContext() : undefined),
		applyIntent: (intent, event) => this.applyIntent(intent, event),
	});

	private initialValue = Number.NaN;

	static get observedAttributes(): string[] {
		return ["value", "min", "max", "step", "alt-step", "alt-default", "modifier", "overflow", "disabled", "size", "tone", "label", "labelledby", "name", "show-value", "hide-label", "default", "static-value"];
	}

	private editing = false;

	constructor() {
		super();
		if (typeof this.attachInternals === "function") {
			this.internals = this.attachInternals();
		}
	}

	override connectedCallback(): void {
		super.connectedCallback();
		if (Number.isNaN(this.initialValue)) {
			const raw = this.getAttribute("value");
			this.initialValue = raw === null ? this.min : Number(raw);
		}
	}

	/** The value a double-click on the thumb restores: an explicit `default`, else the value the slider first rendered with. */
	get defaultValue(): number {
		const explicit = this.getAttribute("default");
		if (explicit !== null && explicit !== "") return this.clamp(Number(explicit));
		return this.clamp(Number.isNaN(this.initialValue) ? this.min : this.initialValue);
	}

	/** Whether clicking the shown value opens an inline editor. On by default when the value is shown; opt out with `static-value`. */
	get editableValue(): boolean {
		return this.showValue && !this.hasAttribute("static-value");
	}

	get min(): number {
		return Number(this.getAttribute("min") ?? "0");
	}
	set min(value: number) {
		this.setAttribute("min", String(value));
	}

	get max(): number {
		return Number(this.getAttribute("max") ?? "100");
	}
	set max(value: number) {
		this.setAttribute("max", String(value));
	}

	get step(): number {
		const step = Number(this.getAttribute("step") ?? "1");
		return step > 0 ? step : 1;
	}
	set step(value: number) {
		this.setAttribute("step", String(value));
	}

	/** The step taken while the modifier is held (a coarser or finer jump); defaults to `step * 10`. */
	get altStep(): number {
		const raw = Number(this.getAttribute("alt-step"));
		return this.getAttribute("alt-step") !== null && raw > 0 ? raw : this.step * 10;
	}
	set altStep(value: number) {
		this.setAttribute("alt-step", String(value));
	}

	/** Invert the modifier: the alt step becomes the unmodified default and the base `step` needs the modifier. */
	get altDefault(): boolean {
		return this.hasAttribute("alt-default");
	}
	set altDefault(value: boolean) {
		this.reflectBoolean("alt-default", value);
	}

	/** Which key toggles between `step` and `altStep` for keyboard and drag; mirrors the number field. */
	get modifier(): "shift" | "alt" | "ctrl" | "meta" {
		const raw = (this.getAttribute("modifier") ?? "shift").toLowerCase();
		return raw === "alt" || raw === "ctrl" || raw === "meta" ? raw : "shift";
	}
	set modifier(value: "shift" | "alt" | "ctrl" | "meta") {
		this.setAttribute("modifier", value);
	}

	/** Let a typed value exceed `min`/`max`: the thumb pins at the rail edge while the true value is kept
	 * and emitted (the announced range widens to include it). Drag and arrow-stepping still stay on the rail. */
	get overflow(): boolean {
		return this.hasAttribute("overflow");
	}
	set overflow(value: boolean) {
		this.reflectBoolean("overflow", value);
	}

	/** The finest grid the slider snaps to (the smaller of `step` / `altStep`), so a fine modifier step and
	 * a typed value both land on a value the coarse step can't express. */
	private get snapGrid(): number {
		return Math.min(this.step, this.altStep);
	}

	get value(): number {
		const raw = this.getAttribute("value");
		return this.clamp(raw === null ? this.min : Number(raw));
	}
	set value(value: number) {
		this.setAttribute("value", String(this.clamp(value)));
	}

	get disabled(): boolean {
		return this.hasAttribute("disabled");
	}
	set disabled(value: boolean) {
		this.reflectBoolean("disabled", value);
	}

	get size(): Size {
		return (this.getAttribute("size") as Size) ?? "md";
	}
	set size(value: Size) {
		this.setAttribute("size", value);
	}

	get tone(): FullTone {
		return (this.getAttribute("tone") as FullTone) ?? "accent";
	}
	set tone(value: FullTone) {
		this.setAttribute("tone", value);
	}

	get showValue(): boolean {
		return this.hasAttribute("show-value");
	}
	set showValue(value: boolean) {
		this.reflectBoolean("show-value", value);
	}

	get hideLabel(): boolean {
		return this.hasAttribute("hide-label");
	}
	set hideLabel(value: boolean) {
		this.reflectBoolean("hide-label", value);
	}

	get format(): ((value: number) => string) | null {
		return this.formatFn;
	}
	set format(fn: ((value: number) => string) | null) {
		this.formatFn = typeof fn === "function" ? fn : null;
		if (this.root.firstChild) this.render();
	}

	private formatValue(value: number): string {
		return this.formatFn ? this.formatFn(value) : String(value);
	}

	private clamp(value: number): number {
		if (Number.isNaN(value)) return this.min;
		// Overflow keeps a typed value exact and uncapped; the stepping paths (drag / arrow) do their own
		// grid snap, so a plain value set here isn't re-snapped and can't drift off a fine typed number.
		if (this.overflow) return Number(value.toFixed(6));
		const { min, max, snapGrid } = this;
		const snapped = Number((Math.round((value - min) / snapGrid) * snapGrid + min).toFixed(6));
		return Math.min(max, Math.max(min, snapped));
	}

	/** Snap a raw value to a specific grid and cap it to the rail; drag and arrow-stepping never overflow. */
	private snapTo(value: number, grid: number): number {
		const { min, max } = this;
		if (Number.isNaN(value)) return min;
		const snapped = Number((Math.round((value - min) / grid) * grid + min).toFixed(6));
		return Math.min(max, Math.max(min, snapped));
	}

	private modifierPressed(event: MouseEvent | KeyboardEvent): boolean {
		switch (this.modifier) {
			case "alt":
				return event.altKey;
			case "ctrl":
				return event.ctrlKey;
			case "meta":
				return event.metaKey;
			default:
				return event.shiftKey;
		}
	}

	/** The step this event should take: the alt step when the modifier is engaged, else the base step. */
	private stepFor(event: MouseEvent | KeyboardEvent): number {
		const useAlt = this.altDefault ? !this.modifierPressed(event) : this.modifierPressed(event);
		return useAlt ? this.altStep : this.step;
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return {
			value: this.value,
			min: this.min,
			max: this.max,
			step: this.step,
			altStep: this.altStep,
			disabled: this.disabled,
			size: this.size,
			tone: this.tone,
			label: this.getAttribute("label"),
			labelledby: this.getAttribute("labelledby"),
			showValue: this.showValue,
			hideLabel: this.hideLabel,
			valueText: this.formatValue(this.value),
			elementId: this.elementId,
			editableValue: this.editableValue,
			editing: this.editing,
		};
	}

	/** Structural state ops can't patch incrementally: whether the label / value spans exist, the header
	 * arrangement, and whether the readout is currently an editor. A change here rebuilds; a value move is
	 * a cheap patch. */
	private shapeSignature(): string {
		return `${this.getAttribute("label") != null}|${this.showValue}|${this.hideLabel}|${this.editing}`;
	}

	private keyContext(): { value: number; min: number; max: number; step: number } {
		return { value: this.value, min: this.min, max: this.max, step: this.step };
	}

	private get rail(): HTMLElement | null {
		return this.root.querySelector(".xtyle-slider__rail");
	}

	private get thumb(): HTMLElement | null {
		return this.root.querySelector(".xtyle-slider__thumb");
	}

	private syncForm(): void {
		this.internals?.setFormValue(String(this.value));
	}

	private warnIfUnnamed(): void {
		if (!this.getAttribute("label") && !this.getAttribute("labelledby")) {
			console.warn(
				"xtyle-slider: no accessible name. Provide a `label` or `labelledby` so the slider is announced.",
			);
		}
	}

	private commit(next: number, emit: "input" | "change"): void {
		if (this.disabled) return;
		const clamped = this.clamp(next);
		if (clamped === this.value && emit === "input") return;
		this.value = clamped;
		this.render();
		this.dispatchEvent(new Event(emit, { bubbles: true, composed: true }));
		this.syncForm();
	}

	private applyIntent(intent: FragmentIntent, event: Event): void {
		if (intent.preventDefault) event.preventDefault();
		if (intent.setValue !== undefined) {
			this.commit(intent.setValue, intent.commit === "input" ? "input" : "change");
			return;
		}
		if (intent.nudge) {
			const step = intent.forceAlt ? this.altStep : this.stepFor(event as KeyboardEvent);
			this.commit(this.snapTo(this.value + (intent.nudge > 0 ? step : -step), this.snapGrid), "change");
		}
	}

	private valueAtPointer(clientX: number): number {
		const rail = this.rail;
		if (!rail) return this.value;
		const rect = rail.getBoundingClientRect();
		const fraction = rect.width === 0 ? 0 : (clientX - rect.left) / rect.width;
		return this.min + Math.min(1, Math.max(0, fraction)) * (this.max - this.min);
	}

	private onPointerdown(event: PointerEvent): void {
		if (this.disabled) return;
		this.thumb?.focus();
		(event.target as Element).setPointerCapture?.(event.pointerId);
		this.commit(this.snapTo(this.valueAtPointer(event.clientX), this.stepFor(event)), "input");
		const move = (e: PointerEvent) => this.commit(this.snapTo(this.valueAtPointer(e.clientX), this.stepFor(e)), "input");
		const up = (e: PointerEvent) => {
			this.rail?.removeEventListener("pointermove", move);
			this.rail?.removeEventListener("pointerup", up);
			this.commit(this.snapTo(this.valueAtPointer(e.clientX), this.stepFor(e)), "change");
		};
		this.rail?.addEventListener("pointermove", move);
		this.rail?.addEventListener("pointerup", up);
	}

	/** The paths the sandbox can't take stay host-side: the pointer reads the rail's bounding rect, and the
	 * value editor parses and commits the typed number. Both are delegated on the root once, so a remount —
	 * and a mod's own markup — keeps them live. */
	private wireHostEvents(): void {
		if (this.hostWired) return;
		this.hostWired = true;
		this.root.addEventListener("pointerdown", (e) => {
			const target = e.target as HTMLElement | null;
			if (target?.closest(".xtyle-slider__rail")) this.onPointerdown(e as PointerEvent);
		});
		this.root.addEventListener("dblclick", (e) => {
			const target = e.target as HTMLElement | null;
			if (!this.disabled && target?.closest(".xtyle-slider__thumb")) {
				this.commit(this.defaultValue, "change");
			}
		});
		this.root.addEventListener("click", (e) => {
			const target = e.target as HTMLElement | null;
			if (this.editableValue && target?.closest(".xtyle-slider__value")) this.enterValueEdit();
		});
		this.root.addEventListener("keydown", (e) => {
			const target = e.target as HTMLElement | null;
			if (this.editing && target?.closest(".xtyle-slider__value-input")) this.onEditKeydown(e as KeyboardEvent);
		});
		this.root.addEventListener("focusout", (e) => {
			const target = e.target as HTMLElement | null;
			if (this.editing && target?.closest(".xtyle-slider__value-input")) this.finishValueEdit(true);
		});
	}

	private get valueInput(): HTMLInputElement | null {
		return this.root.querySelector<HTMLInputElement>(".xtyle-slider__value-input");
	}

	/** Turn the readout into the inline numeric editor. The field itself is the fill's markup — flipping the
	 * `editing` binding is what draws it — so the host only opens the session and takes the focus. */
	private enterValueEdit(): void {
		if (this.disabled || this.editing) return;
		this.editing = true;
		this.render();
		const input = this.valueInput;
		if (!input) {
			this.editing = false;
			this.render();
			return;
		}
		input.focus();
		input.select();
	}

	/** The editor reads like the number field: Arrow / Page keys step (the modifier swaps base <-> alt step
	 * for big/small jumps), Enter commits, Escape cancels. */
	private onEditKeydown(event: KeyboardEvent): void {
		switch (event.key) {
			case "Enter":
				event.preventDefault();
				this.finishValueEdit(true);
				return;
			case "Escape":
				event.preventDefault();
				this.finishValueEdit(false);
				return;
			case "ArrowUp":
				event.preventDefault();
				this.stepValueEdit(1, event, false);
				return;
			case "ArrowDown":
				event.preventDefault();
				this.stepValueEdit(-1, event, false);
				return;
			case "PageUp":
				event.preventDefault();
				this.stepValueEdit(1, event, true);
				return;
			case "PageDown":
				event.preventDefault();
				this.stepValueEdit(-1, event, true);
				return;
			default:
		}
	}

	/** The thumb tracks live while the editor stays open: `editing` holds the shape, so the update patches
	 * the rail without rebuilding the value span the field sits in. */
	private stepValueEdit(dir: 1 | -1, event: KeyboardEvent, forceAlt: boolean): void {
		const input = this.valueInput;
		if (!input) return;
		const current = Number(input.value.trim());
		const base = Number.isNaN(current) ? this.value : current;
		const step = forceAlt ? this.altStep : this.stepFor(event);
		const next = this.clamp(base + dir * step);
		input.value = String(next);
		this.commit(next, "input");
	}

	/** Close the editor. A saved value is parsed and committed (with `overflow` it may pass min/max;
	 * otherwise it clamps to the rail); either way dropping `editing` renders the readout back. */
	private finishValueEdit(save: boolean): void {
		if (!this.editing) return;
		const typed = this.valueInput?.value.trim() ?? "";
		this.editing = false;
		const next = Number(typed);
		if (save && typed !== "" && !Number.isNaN(next)) this.commit(next, "change");
		else this.render();
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(sliderHostCss);
		const signature = this.shapeSignature();
		const firstPaint = !this.lastShape;
		if (this.lastShape && signature !== this.lastShape) this.fragment.remount();
		this.lastShape = signature;
		this.fragment.update(this.bindings);
		this.wireHostEvents();
		const named = !!this.getAttribute("label") || !!this.getAttribute("labelledby");
		if (firstPaint || named !== this.lastNamed) this.warnIfUnnamed();
		this.lastNamed = named;
		this.syncForm();
	}
}

define("xtyle-slider", XtyleSlider);

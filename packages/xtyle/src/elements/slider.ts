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
	private pointerWired = false;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "slider", {
		context: (handler) => (handler === "keyAdjust" ? this.keyContext() : undefined),
		applyIntent: (intent, event) => this.applyIntent(intent, event),
	});

	private initialValue = Number.NaN;

	static get observedAttributes(): string[] {
		return ["value", "min", "max", "step", "disabled", "size", "tone", "label", "labelledby", "name", "show-value", "hide-label", "default", "static-value"];
	}

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
		const { min, max, step } = this;
		if (Number.isNaN(value)) return min;
		const snapped = Math.round((value - min) / step) * step + min;
		return Math.min(max, Math.max(min, Number(snapped.toFixed(6))));
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
		};
	}

	/** Structural state ops can't patch incrementally: whether the label / value spans exist
	 * and the header arrangement. A change here rebuilds; a value move is a cheap patch. */
	private shapeSignature(): string {
		return `${this.getAttribute("label") != null}|${this.showValue}|${this.hideLabel}`;
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
		if (intent.setValue !== undefined) this.commit(intent.setValue, intent.commit === "input" ? "input" : "change");
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
		this.commit(this.valueAtPointer(event.clientX), "input");
		const move = (e: PointerEvent) => this.commit(this.valueAtPointer(e.clientX), "input");
		const up = (e: PointerEvent) => {
			this.rail?.removeEventListener("pointermove", move);
			this.rail?.removeEventListener("pointerup", up);
			this.commit(this.valueAtPointer(e.clientX), "change");
		};
		this.rail?.addEventListener("pointermove", move);
		this.rail?.addEventListener("pointerup", up);
	}

	/** The pointer (geometry) path stays host-side: it reads the rail's bounding rect, which the
	 * sandbox can't see. Delegated on the shadow root once, so a remount keeps it live. */
	private wirePointer(): void {
		if (this.pointerWired) return;
		this.pointerWired = true;
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
	}

	/** Swap the shown value for an inline number editor; Enter or blur commits the typed value (clamped), Escape cancels. */
	private enterValueEdit(): void {
		if (this.disabled) return;
		const valueSpan = this.root.querySelector(".xtyle-slider__value") as HTMLElement | null;
		if (!valueSpan || valueSpan.querySelector("input")) return;
		const input = document.createElement("input");
		input.type = "text";
		input.inputMode = "decimal";
		input.className = "xtyle-slider__value-input";
		input.value = String(this.value);
		input.setAttribute("aria-label", "Edit value");
		valueSpan.removeAttribute("aria-hidden");
		valueSpan.replaceChildren(input);
		input.focus();
		input.select();
		let done = false;
		const finish = (save: boolean): void => {
			if (done) return;
			done = true;
			input.removeEventListener("keydown", onKey);
			input.removeEventListener("blur", onBlur);
			valueSpan.setAttribute("aria-hidden", "true");
			const next = Number(input.value.trim());
			if (save && input.value.trim() !== "" && !Number.isNaN(next)) this.commit(next, "change");
			else this.render();
		};
		const onKey = (e: KeyboardEvent): void => {
			if (e.key === "Enter") {
				e.preventDefault();
				finish(true);
			} else if (e.key === "Escape") {
				e.preventDefault();
				finish(false);
			}
		};
		const onBlur = (): void => finish(true);
		input.addEventListener("keydown", onKey);
		input.addEventListener("blur", onBlur);
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
		this.wirePointer();
		const named = !!this.getAttribute("label") || !!this.getAttribute("labelledby");
		if (firstPaint || named !== this.lastNamed) this.warnIfUnnamed();
		this.lastNamed = named;
		this.syncForm();
	}
}

define("xtyle-slider", XtyleSlider);

import { XojiElement, define, type StyleMode } from "./base.js";
import type { Size } from "../index.js";
import { numberInputHostCss, clampNumber } from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/number-input/source.generated.js";

export class XojiNumberInput extends XojiElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static formAssociated = true;

	private internals: ElementInternals | null = null;
	private elementId = `xoji-number-${Math.random().toString(36).slice(2, 8)}`;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "number-input", {
		applyIntent: (intent, event) => this.applyIntent(intent, event),
		afterApply: () => this.syncStepButtons(),
	});

	static get observedAttributes(): string[] {
		return ["value", "min", "max", "step", "alt-step", "alt-default", "modifier", "disabled", "size", "label", "labelledby", "name", "placeholder"];
	}

	constructor() {
		super();
		if (typeof this.attachInternals === "function") this.internals = this.attachInternals();
	}

	get min(): number | undefined {
		const raw = this.getAttribute("min");
		return raw === null ? undefined : Number(raw);
	}
	get max(): number | undefined {
		const raw = this.getAttribute("max");
		return raw === null ? undefined : Number(raw);
	}
	/** `step="any"` (the native free-form contract) puts the field in unstepped mode: typed values
	 * commit verbatim with no grid snap and no precision cap, and the steppers fall back to a whole step. */
	get unstepped(): boolean {
		return (this.getAttribute("step") ?? "").trim().toLowerCase() === "any";
	}
	get step(): number {
		if (this.unstepped) return 1;
		const step = Number(this.getAttribute("step") ?? "1");
		return step > 0 ? step : 1;
	}
	get altStep(): number {
		const raw = Number(this.getAttribute("alt-step"));
		return this.getAttribute("alt-step") !== null && raw > 0 ? raw : this.step * 10;
	}
	get altDefault(): boolean {
		return this.hasAttribute("alt-default");
	}
	get modifier(): "shift" | "alt" | "ctrl" | "meta" {
		const raw = (this.getAttribute("modifier") ?? "shift").toLowerCase();
		return raw === "alt" || raw === "ctrl" || raw === "meta" ? raw : "shift";
	}
	private get snapGrid(): number {
		return Math.min(this.step, this.altStep);
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

	get value(): string {
		return this.getAttribute("value") ?? "";
	}
	set value(next: string) {
		if (next === "") this.removeAttribute("value");
		else this.setAttribute("value", String(this.clamp(Number(next))));
	}

	private clamp(value: number): number {
		return clampNumber(value, { min: this.min, max: this.max, grid: this.snapGrid, unstepped: this.unstepped });
	}

	private get numeric(): number {
		const v = Number(this.value);
		return this.value !== "" && !Number.isNaN(v) ? v : (this.min ?? 0);
	}

	private get input(): HTMLInputElement | null {
		return this.root.querySelector(".xoji-number__input");
	}

	private syncStepButtons(): void {
		const dec = this.root.querySelector(".xoji-number__step--dec") as HTMLButtonElement | null;
		const inc = this.root.querySelector(".xoji-number__step--inc") as HTMLButtonElement | null;
		if (dec) dec.disabled = !this.canDec;
		if (inc) inc.disabled = !this.canInc;
		const input = this.input;
		if (input) {
			if (this.min !== undefined) input.setAttribute("aria-valuemin", String(this.min));
			else input.removeAttribute("aria-valuemin");
			if (this.max !== undefined) input.setAttribute("aria-valuemax", String(this.max));
			else input.removeAttribute("aria-valuemax");
		}
	}

	private get canDec(): boolean {
		const n = this.numeric;
		return !(this.disabled || (this.min !== undefined && n <= this.min));
	}

	private get canInc(): boolean {
		const n = this.numeric;
		return !(this.disabled || (this.max !== undefined && n >= this.max));
	}

	attributeChangedCallback(name: string): void {
		if (!this.root.firstChild) return;
		if (name === "value") {
			this.fragment.update(this.bindings);
			this.syncDisplay();
		} else this.render();
	}

	private syncForm(): void {
		this.internals?.setFormValue(this.value);
	}

	private syncDisplay(): void {
		const input = this.input;
		if (input && input !== this.root.activeElement) input.value = this.value;
		this.syncForm();
	}

	private commit(raw: string, kind: "input" | "change"): void {
		if (this.disabled) return;
		const trimmed = raw.trim();
		if (trimmed === "") {
			this.value = "";
		} else {
			const n = Number(trimmed);
			if (Number.isNaN(n)) {
				this.fragment.update(this.bindings);
				this.syncDisplay();
				return;
			}
			this.value = String(n);
		}
		this.fragment.update(this.bindings);
		this.syncDisplay();
		this.dispatchEvent(new Event(kind, { bubbles: true, composed: true }));
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

	private stepFor(event: MouseEvent | KeyboardEvent): number {
		const useAlt = this.altDefault ? !this.modifierPressed(event) : this.modifierPressed(event);
		return useAlt ? this.altStep : this.step;
	}

	private nudge(direction: 1 | -1, step: number): void {
		if (this.disabled) return;
		this.commit(String(this.clamp(this.numeric + direction * step)), "change");
	}

	private warnIfUnnamed(): void {
		if (!this.getAttribute("label") && !this.getAttribute("labelledby")) {
			console.warn(
				"xoji-number-input: no accessible name. Provide a `label` or `labelledby` so the field is announced.",
			);
		}
	}

	private applyIntent(intent: FragmentIntent, event: Event): void {
		if (intent.preventDefault) event.preventDefault();
		if (intent.nudge) {
			const step = intent.forceAlt ? this.altStep : this.stepFor(event as MouseEvent | KeyboardEvent);
			this.nudge(intent.nudge > 0 ? 1 : -1, step);
			return;
		}
		if (intent.commit !== undefined) this.commit(intent.commit, "change");
	}

	private get bindings(): Record<string, unknown> {
		return {
			value: this.value,
			min: this.min,
			max: this.max,
			disabled: this.disabled,
			size: this.size,
			label: this.getAttribute("label"),
			labelledby: this.getAttribute("labelledby"),
			placeholder: this.getAttribute("placeholder"),
			elementId: this.elementId,
			canDec: this.canDec,
			canInc: this.canInc,
		};
	}

	/** Structural state ops can't patch incrementally: the `disabled` boolean attr and whether
	 * the label span exists. A change here rebuilds; a value or step-availability flip is a cheap patch. */
	private shapeSignature(): string {
		return `${this.disabled}|${this.getAttribute("label") != null}|${this.getAttribute("labelledby") != null}|${this.getAttribute("placeholder") != null}`;
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(numberInputHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
		this.warnIfUnnamed();
		this.syncDisplay();
	}
}

define("xoji-number-input", XojiNumberInput);

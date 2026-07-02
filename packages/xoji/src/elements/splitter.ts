import { XojiElement, define, type StyleMode } from "./base.js";
import { splitterHostCss } from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/splitter/source.generated.js";

export type SplitterOrientation = "vertical" | "horizontal";
export type SplitterSize = "sm" | "md" | "lg";

export class XojiSplitter extends XojiElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "splitter", {
		context: () => ({ axisIsX: this.axisIsX, reversed: this.reversed }),
		applyIntent: (intent, event) => this.applyIntent(intent, event),
		// The handle is built by the async `mount` op, not the static scaffold, so on a cold first
		// mount it doesn't exist when `render()` runs. Wire it after every apply, once the op's DOM
		// is live: a fresh handle (cold mount or a reshape remount) wires; an unchanged one no-ops.
		afterApply: () => this.wireHandle(),
	});

	static get observedAttributes(): string[] {
		return ["orientation", "size", "line", "min", "max", "step", "value", "default", "disabled", "reversed", "var", "for", "label", "labelledby"];
	}

	get orientation(): SplitterOrientation {
		return this.getAttribute("orientation") === "horizontal" ? "horizontal" : "vertical";
	}
	set orientation(value: SplitterOrientation) {
		this.setAttribute("orientation", value);
	}

	get size(): SplitterSize {
		return (this.getAttribute("size") as SplitterSize) ?? "md";
	}
	set size(value: SplitterSize) {
		this.setAttribute("size", value);
	}

	get line(): boolean {
		return this.hasAttribute("line");
	}
	set line(value: boolean) {
		this.reflectBoolean("line", value);
	}

	get min(): number {
		return Number(this.getAttribute("min") ?? "0");
	}
	set min(value: number) {
		this.setAttribute("min", String(value));
	}

	get max(): number {
		const raw = this.getAttribute("max");
		return raw === null ? Number.POSITIVE_INFINITY : Number(raw);
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

	private initialValue = Number.NaN;

	/** The value a double-click on the handle restores: an explicit `default`, else the value the splitter first rendered with. */
	get defaultValue(): number {
		const explicit = this.getAttribute("default");
		if (explicit !== null && explicit !== "") return this.clamp(Number(explicit));
		return this.clamp(Number.isNaN(this.initialValue) ? this.value : this.initialValue);
	}

	get disabled(): boolean {
		return this.hasAttribute("disabled");
	}
	set disabled(value: boolean) {
		this.reflectBoolean("disabled", value);
	}

	get reversed(): boolean {
		return this.hasAttribute("reversed");
	}
	set reversed(value: boolean) {
		this.reflectBoolean("reversed", value);
	}

	private clamp(value: number): number {
		const { min, max, step } = this;
		if (Number.isNaN(value)) return min;
		const snapped = Math.round((value - min) / step) * step + min;
		return Math.min(max, Math.max(min, Number(snapped.toFixed(6))));
	}

	private get handle(): HTMLElement | null {
		return this.root.querySelector(".xoji-splitter");
	}

	private get targetEl(): HTMLElement | null {
		const id = this.getAttribute("for");
		if (id) return (this.getRootNode() as Document | ShadowRoot).getElementById?.(id) ?? document.getElementById(id);
		return this.parentElement;
	}

	private get varName(): string {
		return this.getAttribute("var") ?? "--xoji-splitter-size";
	}

	get axisIsX(): boolean {
		return this.orientation === "vertical";
	}

	attributeChangedCallback(name: string): void {
		if (!this.root.firstChild) return;
		if (name === "value") {
			this.fragment.update(this.bindings);
			this.applyValue();
			return;
		}
		this.render();
	}

	private applyValue(): void {
		this.targetEl?.style.setProperty(this.varName, `${this.value}px`);
	}

	private commit(next: number, emit: "resize" | "resize-end"): void {
		if (this.disabled) return;
		const clamped = this.clamp(next);
		const changed = clamped !== this.value;
		this.value = clamped;
		this.fragment.update(this.bindings);
		this.applyValue();
		if (!changed && emit === "resize") return;
		this.dispatchEvent(
			new CustomEvent(emit, {
				bubbles: true,
				composed: true,
				detail: { value: this.value, orientation: this.orientation },
			}),
		);
	}

	private onPointerdown(event: PointerEvent): void {
		if (this.disabled) return;
		event.preventDefault();
		// The handle focuses itself so the arrow keys can drive it after the click, but a scripted
		// `focus()` mid-pointer trips `:focus-visible` — so flag this focus as pointer-originated and
		// let the handle's own focus listener withhold the keyboard ring (see wireHandle).
		this.focusViaPointer = true;
		this.handle?.focus();
		const startPos = this.axisIsX ? event.clientX : event.clientY;
		const startValue = this.value;
		// Capture is a complement, not the lifeline: the move/up listeners live on `window` so the
		// drag tracks the pointer anywhere on screen even when capture doesn't hold (a thin vertical
		// handle in WebView2 loses it the moment the pointer leaves the few-px strip).
		(event.target as Element).setPointerCapture?.(event.pointerId);
		const sign = this.reversed ? -1 : 1;
		const move = (e: PointerEvent) => {
			const delta = (this.axisIsX ? e.clientX : e.clientY) - startPos;
			this.commit(startValue + sign * delta, "resize");
		};
		const end = (e: PointerEvent) => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", end);
			window.removeEventListener("pointercancel", end);
			this.focusViaPointer = false;
			const delta = (this.axisIsX ? e.clientX : e.clientY) - startPos;
			this.commit(startValue + sign * delta, "resize-end");
		};
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", end);
		window.addEventListener("pointercancel", end);
	}

	private applyIntent(intent: FragmentIntent, event: Event): void {
		if (intent.preventDefault) event.preventDefault();
		if (intent.reset) {
			this.commit(this.defaultValue, "resize-end");
			return;
		}
		if (intent.jump) {
			const next = intent.jump === "min" ? this.min : Number.isFinite(this.max) ? this.max : this.value;
			this.commit(next, "resize-end");
			return;
		}
		if (intent.nudge) {
			const big = intent.forceAlt ? this.step * 10 : this.step;
			this.commit(this.value + intent.nudge * big, "resize-end");
		}
	}

	private get bindings(): Record<string, unknown> {
		return {
			orientation: this.orientation,
			size: this.size,
			line: this.line,
			value: this.value,
			min: this.min,
			max: Number.isFinite(this.max) ? this.max : this.value,
			disabled: this.disabled,
			label: this.getAttribute("label"),
			labelledby: this.getAttribute("labelledby"),
		};
	}

	/** Structural state ops can't patch incrementally: the `disabled` boolean drops `tabindex` and
	 * adds `aria-disabled`, and the accessible-name source can switch between `label` and `labelledby`.
	 * A change here rebuilds; orientation / size / line / value flips are cheap patches. */
	private shapeSignature(): string {
		return `${this.disabled}|${this.getAttribute("label") != null}|${this.getAttribute("labelledby") != null}`;
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		if (Number.isNaN(this.initialValue)) this.initialValue = this.value;
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(splitterHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
		this.applyValue();
	}

	private focusViaPointer = false;

	private wiredHandle: HTMLElement | null = null;
	private wireHandle(): void {
		const handle = this.handle;
		if (!handle || handle === this.wiredHandle) return;
		this.wiredHandle = handle;
		handle.addEventListener("pointerdown", (e) => this.onPointerdown(e as PointerEvent));
		handle.addEventListener("dblclick", () => this.commit(this.defaultValue, "resize-end"));
		// Paint the focus ring only on genuine keyboard entry: Tab focus (no preceding pointer) and any
		// key press arm it; the pointer-originated focus from a drag does not, so a mouse drag never rings.
		handle.addEventListener("focus", () => {
			if (this.focusViaPointer) return;
			handle.setAttribute("data-focus-ring", "");
		});
		handle.addEventListener("keydown", () => handle.setAttribute("data-focus-ring", ""));
		handle.addEventListener("blur", () => {
			handle.removeAttribute("data-focus-ring");
			this.focusViaPointer = false;
		});
	}
}

define("xoji-splitter", XojiSplitter);

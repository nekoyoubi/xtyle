import { XtyleElement, define, readAttrOrProp, readBoolAttrOrProp, type StyleMode } from "./base.js";
import type { Size, FullTone } from "../index.js";
import { segmentedHostCss, normalizeSegments, selectedValue, type Segment, type SegmentInput } from "../markup/index.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/segmented/source.generated.js";

interface NavContext {
	enabledKeys: string[];
}

export class XtyleSegmented extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static formAssociated = true;

	private internals: ElementInternals | null = null;
	private elementId = `xtyle-segmented-${Math.random().toString(36).slice(2, 8)}`;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "segmented", {
		context: (handler) => (handler === "navKeydown" ? this.navContext() : undefined),
		applyIntent: (intent, event) => this.applyIntent(intent, event),
	});

	static get observedAttributes(): string[] {
		return ["value", "options", "disabled", "size", "tone", "label", "labelledby", "aria-label", "name"];
	}

	constructor() {
		super();
		if (typeof this.attachInternals === "function") this.internals = this.attachInternals();
	}

	private settleHandle = 0;

	override connectedCallback(): void {
		super.connectedCallback();
		this.scheduleSettle();
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		if (this.settleHandle && typeof cancelAnimationFrame !== "undefined") cancelAnimationFrame(this.settleHandle);
		this.settleHandle = 0;
	}

	/** Re-assert the child→slot mapping once the DOM settles after connect: a framework re-render or a
	 * view-transition swap can connect this element before its `[slot="segment"]` children are in place,
	 * which would leave a segment unslotted and its content unstyled until the next render. A second pass
	 * on the next frame runs against the settled child set. */
	private scheduleSettle(): void {
		if (typeof requestAnimationFrame === "undefined") return;
		if (this.settleHandle) cancelAnimationFrame(this.settleHandle);
		this.settleHandle = requestAnimationFrame(() => {
			this.settleHandle = 0;
			if (this.isConnected && this.root.firstChild) this.render();
		});
	}

	private optionsProp: Segment[] | null = null;

	/** The light-DOM segment children — `[slot="segment"]` before the element reindexes them, and
	 * `[slot^="segment-"]` after — the rich-content authoring mode where each segment projects an
	 * icon or other framework-owned markup instead of a plain text label. */
	private get segChildren(): HTMLElement[] {
		return Array.from(
			this.querySelectorAll<HTMLElement>(':scope > [slot="segment"], :scope > [slot^="segment-"]'),
		);
	}

	/** Derive segments from the light-DOM children: `value` / `label` / `disabled` read off each child
	 * (attributes, or the DOM properties a framework may set instead), plus the `slot` name the fill
	 * projects the child's content through. Selection, roving tabindex, and the form value are then
	 * identical to the `options` path — the segments just carry a slot instead of a text label. */
	private childSegments(): Segment[] {
		return this.segChildren.map((child, i) => {
			const value = readAttrOrProp(child, "value") ?? String(i);
			const label = readAttrOrProp(child, "label") ?? child.getAttribute("aria-label") ?? value;
			const disabled = readBoolAttrOrProp(child, "disabled") || child.getAttribute("aria-disabled") === "true";
			const seg: Segment = { value, label, slot: `segment-${i}` };
			if (disabled) seg.disabled = true;
			return seg;
		});
	}

	/** Options as the comma-string shorthand (`label:value` pairs or bare labels), or a structured
	 * `{ value, label }[]` set through the JS property for labels that differ from their value or carry
	 * commas / colons the shorthand can't survive. Light-DOM `[slot="segment"]` children win over both
	 * when present, so a rich-content bar can still fall back to the `options` shorthand. */
	private get segments(): Segment[] {
		const fromChildren = this.childSegments();
		if (fromChildren.length > 0) return fromChildren;
		return this.optionsProp ?? normalizeSegments(this.getAttribute("options"));
	}

	/** Project each light-DOM child through its own named slot so live framework content stays mounted
	 * and reactive — mirrors the fill's `<slot name="segment-${i}">` by index. */
	private assignSegmentSlots(): void {
		this.segChildren.forEach((child, i) => child.setAttribute("slot", `segment-${i}`));
	}

	get options(): Segment[] {
		return this.segments;
	}
	set options(value: SegmentInput | null | undefined) {
		this.optionsProp = value == null ? null : normalizeSegments(value);
		if (this.root.firstChild) this.render();
	}

	get value(): string {
		return selectedValue(this.segments, this.getAttribute("value"));
	}
	set value(next: string) {
		this.setAttribute("value", next);
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

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return {
			segments: this.segments,
			value: this.getAttribute("value"),
			disabled: this.disabled,
			size: this.size,
			tone: this.tone,
			label: this.getAttribute("label"),
			labelledby: this.getAttribute("labelledby"),
			ariaLabel: this.getAttribute("aria-label"),
			elementId: this.elementId,
		};
	}

	/** Structural state ops can't patch incrementally: the option set and the `disabled` boolean
	 * attr on each button, plus whether the label span exists. A change here rebuilds; a selection
	 * move is a cheap patch that keeps the focused node. */
	private shapeSignature(): string {
		const segs = JSON.stringify(this.segments);
		const naming = `${this.getAttribute("label")}|${this.getAttribute("labelledby")}|${this.getAttribute("aria-label")}`;
		return `${this.disabled}|${naming}|${segs}`;
	}

	private syncForm(): void {
		this.internals?.setFormValue(this.value);
	}

	private navContext(): NavContext {
		const enabledKeys = this.disabled ? [] : this.segments.filter((s) => !s.disabled).map((s) => s.value);
		return { enabledKeys };
	}

	private applyIntent(intent: FragmentIntent, event: Event): void {
		if (intent.preventDefault) event.preventDefault();
		if (intent.select !== undefined && intent.select !== this.value) {
			this.value = intent.select;
			this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
			this.syncForm();
		}
		if (intent.focus !== undefined) {
			const option = this.root.querySelector<HTMLElement>(
				`[role="radio"][data-value="${CSS.escape(intent.focus)}"]`,
			);
			option?.focus();
		}
	}

	private warnIfUnnamed(): void {
		if (!this.getAttribute("label") && !this.getAttribute("labelledby") && !this.getAttribute("aria-label")) {
			console.warn(
				"xtyle-segmented: no accessible name. Provide a `label`, `labelledby`, or `aria-label` so the group is announced.",
			);
		}
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.assignSegmentSlots();
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(segmentedHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
		this.warnIfUnnamed();
		this.syncForm();
	}
}

define("xtyle-segmented", XtyleSegmented);

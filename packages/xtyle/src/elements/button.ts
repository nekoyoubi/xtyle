import { XtyleElement, define, type StyleMode } from "./base.js";
import type { ButtonVariant, ButtonAlign, Size, FullTone } from "../index.js";
import { buttonHostCss } from "../markup/index.js";
import type { ButtonSize } from "../markup/button.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/button/source.generated.js";
import { resolveTone, resolveVocab, BUTTON_VARIANTS, BUTTON_SIZES, BUTTON_ALIGNS } from "../vocab.js";


export class XtyleButton extends XtyleElement {
	static formAssociated = true;

	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "button", {
		applyIntent: () => {},
	});
	private ariaLabelValue: string | null = null;
	private ariaLabelledbyValue: string | null = null;
	private internals: ElementInternals | null = null;

	constructor() {
		super();
		if ("attachInternals" in this) {
			try {
				this.internals = this.attachInternals();
			} catch {
				this.internals = null;
			}
		}
		this.addEventListener("click", (event) => this.submitAcrossShadow(event));
	}

	protected override formInternals(): ElementInternals | null {
		return this.internals;
	}

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["variant", "tone", "size", "align", "type", "form", "href", "disabled", "loading", "block", "icon-only", "pressed", "selected", "focusable", "cursor", "aria-label", "aria-labelledby"];
	}

	private get submitsThroughHost(): boolean {
		return this.isShadow() || this.hasAttribute("form");
	}

	private submitAcrossShadow(event: Event): void {
		const type = this.getAttribute("type");
		if (type !== "submit" && type !== "reset") return;
		if (!this.submitsThroughHost || this.href != null || this.disabled || this.loading) return;
		const form = this.internals?.form;
		if (!form) return;
		queueMicrotask(() => {
			if (event.defaultPrevented) return;
			if (type === "submit") form.requestSubmit();
			else form.reset();
		});
	}

	get variant(): ButtonVariant {
		return resolveVocab(this.getAttribute("variant"), BUTTON_VARIANTS, "solid", "button variant");
	}
	set variant(value: ButtonVariant) {
		this.setAttribute("variant", value);
	}

	get tone(): FullTone {
		return resolveTone(this.getAttribute("tone"), "accent");
	}
	set tone(value: FullTone) {
		this.setAttribute("tone", value);
	}

	get size(): ButtonSize {
		return resolveVocab(this.getAttribute("size"), BUTTON_SIZES, "md", "button size");
	}
	set size(value: ButtonSize) {
		this.setAttribute("size", value);
	}

	get align(): ButtonAlign {
		return resolveVocab(this.getAttribute("align"), BUTTON_ALIGNS, "center", "button align");
	}
	set align(value: ButtonAlign) {
		this.setAttribute("align", value);
	}

	get disabled(): boolean {
		return this.hasAttribute("disabled");
	}
	set disabled(value: boolean) {
		this.reflectBoolean("disabled", value);
	}

	get loading(): boolean {
		return this.hasAttribute("loading");
	}
	set loading(value: boolean) {
		this.reflectBoolean("loading", value);
	}

	get block(): boolean {
		return this.hasAttribute("block");
	}
	set block(value: boolean) {
		this.reflectBoolean("block", value);
	}

	get iconOnly(): boolean {
		return this.hasAttribute("icon-only");
	}
	set iconOnly(value: boolean) {
		this.reflectBoolean("icon-only", value);
	}

	get pressed(): boolean | null {
		const value = this.getAttribute("pressed");
		if (value === null) return null;
		return value !== "false";
	}
	set pressed(value: boolean | null) {
		if (value === null) this.removeAttribute("pressed");
		else this.setAttribute("pressed", String(value));
	}

	get selected(): boolean | null {
		const value = this.getAttribute("selected");
		if (value === null) return null;
		return value !== "false";
	}
	set selected(value: boolean | null) {
		if (value === null) this.removeAttribute("selected");
		else this.setAttribute("selected", String(value));
	}

	/** Whether the app's own keyboard cursor rests on this button: draws the focus ring without moving focus. */
	get cursor(): boolean {
		return this.hasAttribute("cursor");
	}
	set cursor(value: boolean) {
		this.reflectBoolean("cursor", value);
	}

	get href(): string | null {
		return this.getAttribute("href");
	}

	attributeChangedCallback(name?: string): void {
		// INFO: `aria-label`/`aria-labelledby` are invalid on the roleless host and never reach the
		// inner control, so capture them off the host and forward them onto the `<button>`/`<a>`
		if (name === "aria-label" || name === "aria-labelledby") {
			const value = this.getAttribute(name);
			if (value !== null) {
				if (name === "aria-label") this.ariaLabelValue = value;
				else this.ariaLabelledbyValue = value;
				this.removeAttribute(name);
				return;
			}
		}
		if (this.root.firstChild) this.render();
	}

	private get bindings(): Record<string, unknown> {
		return {
			variant: this.variant,
			tone: this.tone,
			size: this.size,
			align: this.align,
			type: this.submitsThroughHost ? "button" : (this.getAttribute("type") ?? "button"),
			href: this.href,
			disabled: this.disabled,
			loading: this.loading,
			block: this.block,
			iconOnly: this.iconOnly,
			pressed: this.pressed,
			selected: this.selected,
			focusable: this.focusable,
			cursor: this.cursor,
			ariaLabel: this.ariaLabelValue ?? (this.ariaLabelledbyValue ? null : this.slottedName()),
			ariaLabelledby: this.ariaLabelledbyValue,
		};
	}

	/** A signature of the state ops can't express incrementally — the tag (`href`) and the
	 * blocked state (`disabled` / `loading`, which add a boolean attr a `setAttr` can't remove).
	 * When it changes, the structure is rebuilt rather than patched. */
	private shapeSignature(): string {
		return `${this.href != null}|${this.disabled || this.loading}`;
	}

	private warnIfUnnamed(): void {
		// INFO: on upgrade, attributes fire in DOM order, so this can run before `aria-label` is
		// captured onto `ariaLabelValue`; honor the live attribute too or it warns spuriously mid-upgrade
		const named =
			this.ariaLabelValue ||
			this.ariaLabelledbyValue ||
			this.getAttribute("aria-label") ||
			this.getAttribute("aria-labelledby");
		if (this.iconOnly && !named) {
			console.warn(
				"xtyle-button: an icon-only button has no accessible name. Provide an `aria-label` so it is announced.",
			);
		}
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(buttonHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
		this.wireLabelSlot();
		this.warnIfUnnamed();
	}

	private wiredLabelSlot: HTMLSlotElement | null = null;
	private wireLabelSlot(): void {
		const slot = this.root.querySelector<HTMLSlotElement>("slot:not([name])");
		if (!slot || slot === this.wiredLabelSlot) return;
		this.wiredLabelSlot = slot;
		slot.addEventListener("slotchange", () => this.fragment.update(this.bindings));
	}
}

define("xtyle-button", XtyleButton);

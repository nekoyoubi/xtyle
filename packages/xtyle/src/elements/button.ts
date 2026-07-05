import { XtyleElement, define, type StyleMode } from "./base.js";
import type { ButtonVariant, ButtonAlign, Size, FullTone } from "../index.js";
import { buttonHostCss } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/button/source.generated.js";

type ButtonSize = Size | "xs";

export class XtyleButton extends XtyleElement {
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "button", {
		applyIntent: () => {},
	});
	private ariaLabelValue: string | null = null;
	private ariaLabelledbyValue: string | null = null;

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["variant", "tone", "size", "align", "type", "href", "disabled", "loading", "block", "icon-only", "pressed", "selected", "aria-label", "aria-labelledby"];
	}

	get variant(): ButtonVariant {
		return (this.getAttribute("variant") as ButtonVariant) ?? "solid";
	}
	set variant(value: ButtonVariant) {
		this.setAttribute("variant", value);
	}

	get tone(): FullTone {
		return (this.getAttribute("tone") as FullTone) ?? "accent";
	}
	set tone(value: FullTone) {
		this.setAttribute("tone", value);
	}

	get size(): ButtonSize {
		return (this.getAttribute("size") as ButtonSize) ?? "md";
	}
	set size(value: ButtonSize) {
		this.setAttribute("size", value);
	}

	get align(): ButtonAlign {
		return (this.getAttribute("align") as ButtonAlign) ?? "center";
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

	get href(): string | null {
		return this.getAttribute("href");
	}

	attributeChangedCallback(name?: string): void {
		// `aria-label`/`aria-labelledby` are prohibited on the roleless host and never reach the
		// inner control, so capture them off the host and forward them onto the `<button>`/`<a>`.
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
			type: this.getAttribute("type") ?? "button",
			href: this.href,
			disabled: this.disabled,
			loading: this.loading,
			block: this.block,
			iconOnly: this.iconOnly,
			pressed: this.pressed,
			selected: this.selected,
			ariaLabel: this.ariaLabelValue,
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
		// The name may still be on the host as an unprocessed attribute: on upgrade the attributes
		// fire in DOM order, so a render (and this check) can run before `aria-label` (spread last by
		// the bindings) has been captured onto `ariaLabelValue` and stripped. Honor the live attribute
		// too, or a correctly-labelled icon-only button warns spuriously mid-upgrade.
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
		this.warnIfUnnamed();
	}
}

define("xtyle-button", XtyleButton);

import { XtyleElement, define, type StyleMode } from "./base.js";
import type { Size } from "../index.js";
import { formGroupHostCss } from "../markup/index.js";
import { FragmentHost } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/form-group/source.generated.js";
import { resolveVocab, SIZES } from "../vocab.js";

let formGroupCounter = 0;

export class XtyleFormGroup extends XtyleElement {
	private groupNumber = ++formGroupCounter;
	private labelId = `xtyle-form-group-label-${this.groupNumber}`;
	private controlId = `xtyle-form-group-control-${this.groupNumber}`;
	private descriptionId = `xtyle-form-group-desc-${this.groupNumber}`;
	private errorId = `xtyle-form-group-error-${this.groupNumber}`;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "form-group", {
		applyIntent: () => {},
		afterApply: () => this.bindRegion(),
	});
	private contentObserver: MutationObserver | null = null;

	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static get observedAttributes(): string[] {
		return ["label", "description", "error", "size", "invalid", "required", "for"];
	}

	get label(): string {
		return this.getAttribute("label") ?? "";
	}
	set label(value: string | null | undefined) {
		this.reflectString("label", value);
	}

	get description(): string {
		return this.getAttribute("description") ?? "";
	}
	set description(value: string | null | undefined) {
		this.reflectString("description", value);
	}

	get error(): string {
		return this.getAttribute("error") ?? "";
	}
	set error(value: string | null | undefined) {
		this.reflectString("error", value);
	}

	get size(): Size {
		return resolveVocab(this.getAttribute("size"), SIZES, "md", "form-group size");
	}
	set size(value: Size) {
		this.setAttribute("size", value);
	}

	get invalid(): boolean {
		return this.hasAttribute("invalid");
	}
	set invalid(value: boolean) {
		this.reflectBoolean("invalid", value);
	}

	get required(): boolean {
		return this.hasAttribute("required");
	}
	set required(value: boolean) {
		this.reflectBoolean("required", value);
	}

	attributeChangedCallback(): void {
		if (this.root.firstChild) this.render();
	}

	private get controlTarget(): string {
		return this.getAttribute("for") ?? this.controlId;
	}

	private get bindings(): Record<string, unknown> {
		return {
			label: this.label,
			description: this.description,
			error: this.error,
			size: this.size,
			invalid: this.invalid,
			required: this.required,
			hasFor: this.getAttribute("for") !== null,
			controlTarget: this.controlTarget,
			labelId: this.labelId,
			descriptionId: this.descriptionId,
			errorId: this.errorId,
		};
	}

	/** A signature of the state ops can't express incrementally — the label's `for` attribute,
	 * which `setAttr` can add but not remove. When it flips, the structure is rebuilt rather than
	 * patched. */
	private shapeSignature(): string {
		return `${this.getAttribute("for") !== null}`;
	}

	private get describedBy(): string {
		const ids: string[] = [];
		if (this.description.length > 0) ids.push(this.descriptionId);
		if (this.invalid && this.error.length > 0) ids.push(this.errorId);
		return ids.join(" ");
	}

	/** The consumer's control, now a light-DOM descendant rather than slotted-across-a-boundary.
	 * It lives in the scaffold's `[data-slot]` region once mounted, or as a direct child before
	 * the first render relocates it (the client-created path). */
	private get assignedControl(): HTMLElement | null {
		const region = this.querySelector("[data-slot]");
		const scope = region ?? this;
		const elements = region ? region.children : this.children;
		for (const el of elements) {
			if (el instanceof HTMLElement && this.isControlLike(el)) return el;
		}
		const first = scope.firstElementChild;
		return first instanceof HTMLElement ? first : null;
	}

	private isControlLike(el: HTMLElement): boolean {
		const tag = el.tagName.toLowerCase();
		if (["input", "select", "textarea", "button"].includes(tag)) return true;
		return tag.startsWith("xtyle-") || el.hasAttribute("role");
	}

	/** Whether ARIA naming/validity attributes may be applied directly — true for native form
	 * controls or any element that declares a role; false for a bare custom element, where those
	 * attributes are prohibited and must be handled by the control itself. */
	private isNameable(el: HTMLElement): boolean {
		const tag = el.tagName.toLowerCase();
		return ["input", "select", "textarea", "button", "meter", "progress", "output"].includes(tag) || el.hasAttribute("role");
	}

	private wireControl(): void {
		const control = this.assignedControl;
		if (!control) return;

		if (this.getAttribute("for") === null && !control.id) {
			control.id = this.controlId;
		}

		// `aria-describedby` is a global attribute, valid on any element.
		const describedBy = this.describedBy;
		if (describedBy.length > 0) control.setAttribute("aria-describedby", describedBy);
		else control.removeAttribute("aria-describedby");

		// `aria-invalid` / `aria-required` are prohibited on a roleless element, so only apply
		// them to a native form control (or one that declares a role). A custom element is
		// expected to carry its own validity semantics.
		if (this.isNameable(control)) {
			if (this.invalid) control.setAttribute("aria-invalid", "true");
			else control.removeAttribute("aria-invalid");

			if (this.required) control.setAttribute("aria-required", "true");
			else control.removeAttribute("aria-required");
		}

		// In light DOM the label and control share a tree, so native `<label for>` resolves —
		// it names labelable controls and gives click-to-focus for free, no `aria-label` mirror
		// and no manual click handler. (A roleless custom element isn't labelable by `for`; it
		// names itself, as before.) When the consumer set `for` on the host, the fill already
		// emitted that `for` and we leave it be.
		const label = this.root.querySelector<HTMLElement>(`#${CSS.escape(this.labelId)}`);
		if (label && this.getAttribute("for") === null && control.id) {
			label.setAttribute("for", control.id);
		}
	}

	private warnIfUnlabelled(): void {
		if (this.label.length === 0) {
			console.warn(
				"xtyle-form-group: no `label` was provided. The slotted control may lack an accessible name; provide a `label` or label the control directly.",
			);
		}
	}

	protected template(): string {
		return "";
	}

	// Light DOM has no `slotchange`, so watch the region for a swapped-in control instead.
	// `wireControl` only sets attributes (never children), so observing `childList` can't loop.
	// Runs from both `render` and `afterApply`: the `[data-slot]` region is built by the async
	// fragment fill, so the first shadow-DOM instance has no region when `render` runs and the
	// observer would never arm without the `afterApply` pass. Idempotent (the observer arms once).
	private bindRegion = (): void => {
		this.wireControl();
		if (!this.contentObserver) {
			const region = this.querySelector("[data-slot]");
			if (region) {
				this.contentObserver = new MutationObserver(() => this.wireControl());
				this.contentObserver.observe(region, { childList: true });
			}
		}
	};

	protected override render(): void {
		this.adoptComponentSheet();
		this.fragment.ensureScaffold(formGroupHostCss);
		this.fragment.reshapeIfChanged(this.shapeSignature());
		this.fragment.update(this.bindings);
		this.bindRegion();
		this.warnIfUnlabelled();
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.contentObserver?.disconnect();
		this.contentObserver = null;
	}
}

define("xtyle-form-group", XtyleFormGroup);

import { XtyleElement, define, type StyleMode } from "./base.js";
import type { Size } from "../index.js";
import { comboboxHostCss, filterOptions, optionLabel, type ComboboxFilter } from "../markup/combobox.js";
import { FragmentHost, type FragmentIntent } from "./fragment-host.js";
import { manifest, fragmentSources } from "./fragments/combobox/source.generated.js";
import { normalizeFieldOptions, type FieldOption } from "./field-options.js";
import { NATIVE_INPUT_ATTRS, forwardNativeInputAttrs } from "./native-input-attrs.js";
// the listbox floats in a real <xtyle-popover> the fill declares, so the tag has to be defined
import "./popover.js";
import type { PopoverOpenOptions } from "./popover.js";

export type { ComboboxFilter } from "../markup/combobox.js";
export type { FieldOption } from "./field-options.js";

interface PopoverApi extends HTMLElement {
	open: boolean;
	openFrom(anchor: HTMLElement, opts?: PopoverOpenOptions): void;
	hide(reason?: string, returnFocus?: boolean): void;
	reposition(): void;
}

/** The window in which a click on the toggle is really the tail of the light-dismiss that just closed
 * the panel — swallowed, so the toggle shuts the list instead of instantly reopening it. */
const REOPEN_GUARD_MS = 250;

let comboboxSeq = 0;

/**
 * The themable autocomplete: a text input that filters a list of options in a floating listbox, in a
 * single- or a multi-select posture. Where Field hands its suggestions to a native `<datalist>` and Select
 * to a native `<select>` — both right for the common case, both entirely outside a theme's reach — Combobox
 * draws the whole surface out of the register, so the tokens actually reach the popup, the option rows, and
 * the chips.
 *
 * It speaks the same option contract as Field and Select (`normalizeFieldOptions`), so moving a control
 * across is a tag change rather than a rewrite. The chrome (control, chips, caret, option rows) lives in the
 * fragment; the behavior (filtering, keyboard, focus, placement) lives here; and the hidden input that carries
 * the value into a `<form>` is plumbing that never renders. The listbox floats in a `<xtyle-popover>`, so the
 * anchoring, flipping, top-layer stacking, and light-dismiss are the overlay family's, not re-derived here.
 */
export class XtyleCombobox extends XtyleElement {
	protected override get styleMode(): StyleMode {
		return "auto";
	}

	static formAssociated = true;

	private internals: ElementInternals | null = null;
	private uid = `xtyle-combobox-${++comboboxSeq}`;
	private inputId = `${this.uid}-input`;
	private listId = `${this.uid}-list`;
	private descriptionId = `${this.uid}-desc`;
	private errorId = `${this.uid}-error`;
	private optionsProp: FieldOption[] | null = null;
	private selectionProp: string[] | null = null;
	private queryText = "";
	/** Whether the query is the user's typing or just the committed selection echoed back into the input. Only
	 * the former filters: after a pick, the input reads "London", and reopening the list must still show every
	 * option — not the one row that happens to match the label already sitting in the box. */
	private queryDirty = false;
	private activeValue = "";
	private dismissedAt = 0;
	private settingOpen = false;
	private wiredList: HTMLElement | null = null;
	private wiredControl: HTMLElement | null = null;
	private wiredPopover: PopoverApi | null = null;
	private hostWired = false;
	private fragment = new FragmentHost(this.root, manifest, fragmentSources, "combobox", {
		context: (handler) => (handler === "inputKeydown" ? this.navContext() : undefined),
		applyIntent: (intent, event) => this.applyIntent(intent, event),
		afterApply: () => this.afterApply(),
	});

	constructor() {
		super();
		if ("attachInternals" in this) {
			try {
				this.internals = this.attachInternals();
			} catch {
				this.internals = null;
			}
		}
	}

	static get observedAttributes(): string[] {
		return [
			"label",
			"name",
			"placeholder",
			"value",
			"values",
			"size",
			"multiple",
			"open",
			"filter",
			"allow-custom",
			"clearable",
			"disabled",
			"readonly",
			"invalid",
			"required",
			"description",
			"error",
			"empty-text",
			"options",
			...NATIVE_INPUT_ATTRS,
		];
	}

	/** The option list. Set the JS property with `string[]` or `{ value, label }[]`, or pass the `options`
	 * attribute as a JSON array (the declarative / SSR path) — the same contract Field and Select speak, so
	 * a control moved across keeps its data. */
	get options(): FieldOption[] {
		return this.optionsProp ?? normalizeFieldOptions(this.getAttribute("options"));
	}
	set options(value: ReadonlyArray<string | FieldOption> | string | null | undefined) {
		this.optionsProp = value == null ? null : normalizeFieldOptions(value);
		// the list may only now be able to name what was already selected (options assigned after the value, an
		// async fetch landing) — so re-derive the input's text unless the user has typed over it
		if (!this.queryDirty) this.queryText = this.selectedQuery();
		this.repaint();
	}

	/** The selected value in single-select mode (the first one in multi-select). Setting it replaces the
	 * whole selection. */
	get value(): string {
		return this.values[0] ?? "";
	}
	set value(value: string | null | undefined) {
		this.values = value == null || value === "" ? [] : [value];
	}

	/** Every selected value. The multi-select surface: read it for what the user picked, set it to replace
	 * the selection wholesale. Reflects to the `values` attribute as a JSON array. */
	get values(): string[] {
		if (this.selectionProp) return this.selectionProp;
		const raw = this.getAttribute("values");
		if (raw !== null) return parseValueList(raw);
		const single = this.getAttribute("value");
		return single != null && single !== "" ? [single] : [];
	}
	set values(value: readonly string[] | string | null | undefined) {
		// a framework that sets custom-element props by name (Svelte) hands the declarative `values` down as
		// the JSON string it wrote, not as an array — take either, or the string would spread into characters
		if (typeof value === "string") {
			this.commitSelection(parseValueList(value));
			return;
		}
		this.commitSelection(value == null ? [] : [...value]);
	}

	/** The live text in the input — what the user typed, not what they picked. Read it on `input` to drive
	 * an async option fetch (with `filter="none"`, so the component does not filter the answer again). */
	get query(): string {
		return this.queryText;
	}
	set query(value: string | null | undefined) {
		this.queryText = value ?? "";
		this.queryDirty = true;
		this.repaint();
	}

	get name(): string | null {
		return this.getAttribute("name");
	}
	set name(value: string | null | undefined) {
		this.reflectString("name", value);
	}

	/** Pick many: the selection renders as removable chips in the control, Backspace on an empty query takes
	 * the last one back, and the listbox becomes `aria-multiselectable`. */
	get multiple(): boolean {
		return this.hasAttribute("multiple");
	}
	set multiple(value: boolean) {
		this.reflectBoolean("multiple", value);
	}

	/** Whether the listbox is open. Reflects the popup's real state, and setting it opens or closes the panel. */
	get open(): boolean {
		return this.hasAttribute("open");
	}
	set open(value: boolean) {
		this.reflectBoolean("open", value);
	}

	/** How the typed query narrows the list. `none` leaves the list alone — the async path, where the consumer
	 * swaps `options` on every `input` and a second filter here would fight it. */
	get filter(): ComboboxFilter {
		return (this.getAttribute("filter") as ComboboxFilter) ?? "contains";
	}
	set filter(value: ComboboxFilter) {
		this.reflectString("filter", value);
	}

	/** Accept a value the option list never offered: Enter commits whatever was typed. */
	get allowCustom(): boolean {
		return this.hasAttribute("allow-custom");
	}
	set allowCustom(value: boolean) {
		this.reflectBoolean("allow-custom", value);
	}

	/** Show the clear action once anything is selected or typed: one press empties the whole selection. */
	get clearable(): boolean {
		return this.hasAttribute("clearable");
	}
	set clearable(value: boolean) {
		this.reflectBoolean("clearable", value);
	}

	get size(): Size {
		return (this.getAttribute("size") as Size) ?? "md";
	}
	set size(value: Size) {
		this.setAttribute("size", value);
	}

	get disabled(): boolean {
		return this.hasAttribute("disabled");
	}
	set disabled(value: boolean) {
		this.reflectBoolean("disabled", value);
	}

	get readonly(): boolean {
		return this.hasAttribute("readonly");
	}
	set readonly(value: boolean) {
		this.reflectBoolean("readonly", value);
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

	/** What the panel says when nothing matches the query. */
	get emptyText(): string {
		return this.getAttribute("empty-text") ?? "No matches";
	}
	set emptyText(value: string | null | undefined) {
		this.reflectString("empty-text", value);
	}

	/** The options left after the current query — what the listbox is showing. */
	get visibleOptions(): FieldOption[] {
		return filterOptions(this.options, this.queryDirty ? this.queryText : "", this.filter);
	}

	private get input(): HTMLInputElement | null {
		return this.root.querySelector<HTMLInputElement>("[data-input]");
	}

	private get control(): HTMLElement | null {
		return this.root.querySelector<HTMLElement>("[data-control]");
	}

	private get list(): HTMLElement | null {
		return this.root.querySelector<HTMLElement>("[data-list]");
	}

	private get popup(): PopoverApi | null {
		return this.root.querySelector<PopoverApi>("[data-pop]");
	}

	private get interactive(): boolean {
		return !this.disabled && !this.readonly;
	}

	/** The text an option (or a free-typed custom value) presents. */
	private labelFor(value: string): string {
		const option = this.options.find((candidate) => candidate.value === value);
		return option ? optionLabel(option) : value;
	}

	/** Repaint, but never before the scaffold exists — a framework that assigns props before the element is
	 * connected would otherwise force a first render outside the lifecycle. */
	private repaint(): void {
		if (this.root.firstChild) this.render();
	}

	/**
	 * Open the listbox against the control. `focus: "none"` keeps the caret in the input, which is the whole
	 * point of the pattern: DOM focus never leaves the text box, and `aria-activedescendant` carries the
	 * cursor into the list instead.
	 */
	private openList(): void {
		const pop = this.popup;
		const anchor = this.control;
		if (!pop || !anchor || !this.interactive) return;
		this.setOpenSilently(true);
		this.repaint();
		// hand the panel the control's measured width; an unlaid-out control (a test DOM, a hidden form)
		// measures 0, and pinning the list to 0 would collapse it — leave the CSS fallback standing instead
		const width = anchor.offsetWidth;
		if (width > 0) pop.style.setProperty("--xtyle-combobox-anchor", `${width}px`);
		pop.openFrom(anchor, { focus: "none" });
		pop.reposition();
	}

	private closeList(): void {
		this.activeValue = "";
		this.setOpenSilently(false);
		this.popup?.hide("api", false);
		this.repaint();
	}

	/** Reflect the open state without re-entering `syncOpen` — the element is *driving* the popup here, so the
	 * attribute is an echo of that, not a fresh instruction to open it again. */
	private setOpenSilently(value: boolean): void {
		this.settingOpen = true;
		this.open = value;
		this.settingOpen = false;
	}

	private toggleList(): void {
		if (this.open) {
			this.closeList();
			return;
		}
		// the pointer that light-dismissed the panel a moment ago is the same one landing here; without this
		// the toggle would close and instantly reopen, and a click would never shut the list
		if (this.now() - this.dismissedAt < REOPEN_GUARD_MS) return;
		this.openList();
		this.setActiveEdge("first");
	}

	private now(): number {
		return typeof performance !== "undefined" ? performance.now() : Date.now();
	}

	private setActiveEdge(edge: "first" | "last"): void {
		const matches = this.visibleOptions;
		const option = edge === "first" ? matches[0] : matches[matches.length - 1];
		this.setActive(option?.value ?? "");
	}

	private setActive(value: string): void {
		this.activeValue = value;
		this.repaint();
		this.scrollActiveIntoView();
	}

	/** Keep the active option inside the panel's scroll box. The listbox never holds focus, so nothing else
	 * would scroll it. */
	private scrollActiveIntoView(): void {
		if (!this.activeValue) return;
		const active = this.list?.querySelector<HTMLElement>(`[data-value="${cssEscape(this.activeValue)}"]`);
		active?.scrollIntoView?.({ block: "nearest" });
	}

	/** Commit whatever the keyboard is pointing at: the active option, or — under `allow-custom` — the raw
	 * text that was typed. `leaving` is the Tab case: take the value, but don't grab the caret back or
	 * reopen the list behind the focus that is on its way out. */
	private commitActive(leaving = false): void {
		if (this.activeValue) {
			this.pick(this.activeValue, leaving);
			return;
		}
		const typed = this.queryText.trim();
		if (this.allowCustom && typed.length > 0) this.pick(typed, leaving);
	}

	/**
	 * Take a value into the selection. Single-select replaces and closes; multi-select toggles it in or out,
	 * drops the query, and leaves the list open so the next pick is one keystroke away — unless the user is
	 * on their way out of the control, in which case both postures close and stay closed.
	 */
	private pick(value: string, leaving = false): void {
		if (!this.interactive) return;
		const current = this.values;
		const added = !current.includes(value);
		if (this.multiple) {
			const next = added ? [...current, value] : current.filter((v) => v !== value);
			this.queryText = "";
			this.queryDirty = false;
			this.commitSelection(next);
			this.emitSelect(value, added);
			if (leaving) {
				this.closeList();
				return;
			}
			this.openList();
			this.popup?.reposition();
			this.input?.focus();
			return;
		}
		this.commitSelection([value]);
		this.emitSelect(value, true);
		this.closeList();
		if (!leaving) this.input?.focus();
	}

	private emitSelect(value: string, selected: boolean): void {
		this.dispatchEvent(
			new CustomEvent("select", {
				bubbles: true,
				composed: true,
				detail: { value, label: this.labelFor(value), selected },
			}),
		);
	}

	private removeValue(value: string): void {
		if (!this.interactive) return;
		this.commitSelection(this.values.filter((v) => v !== value));
	}

	private clearAll(): void {
		if (!this.interactive) return;
		this.queryText = "";
		this.queryDirty = false;
		this.commitSelection([]);
	}

	/** The one write path for the selection: hold it, reflect it, settle the query against it, and tell the
	 * consumer. The form value follows on the next paint. */
	private commitSelection(next: string[]): void {
		const changed = !sameValues(this.values, next);
		this.selectionProp = next;
		this.reflectSelection(next);
		this.selectionProp = next;
		// a single-select input *is* the selection, so its text follows it and stops being a filter; a
		// multi-select's query is its own thing (the chips carry the selection), so a commit leaves it alone —
		// only `pick` and the clear action reset it
		if (!this.multiple) {
			this.queryText = this.selectedQuery();
			this.queryDirty = false;
		}
		this.repaint();
		if (changed) this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
	}

	/** Mirror the selection onto the attributes: `value` for the single-select posture, a JSON `values` array
	 * for the multi-select one. */
	private reflectSelection(next: string[]): void {
		if (this.multiple) {
			this.removeAttribute("value");
			this.setAttribute("values", JSON.stringify(next));
			return;
		}
		this.removeAttribute("values");
		if (next.length > 0) this.setAttribute("value", next[0]!);
		else this.removeAttribute("value");
	}

	private navContext(): {
		open: boolean;
		multiple: boolean;
		allowCustom: boolean;
		values: string[];
		activeValue: string;
		query: string;
		selectedCount: number;
	} {
		return {
			open: this.open,
			multiple: this.multiple,
			allowCustom: this.allowCustom,
			values: this.visibleOptions.map((option) => option.value),
			activeValue: this.activeValue,
			query: this.queryText,
			selectedCount: this.values.length,
		};
	}

	private optionId(index: number): string {
		return `${this.uid}-opt-${index}`;
	}

	private get bindings(): Record<string, unknown> {
		const selected = new Set(this.values);
		// a closed combobox paints no options at all, so the zero-JS (pre-hydration) render is just the input:
		// the listbox never flashes below it in the moment before the popover element upgrades
		const matches = this.open ? this.visibleOptions : [];
		const activeIndex = matches.findIndex((option) => option.value === this.activeValue);
		return {
			inputId: this.inputId,
			listId: this.listId,
			descriptionId: this.descriptionId,
			errorId: this.errorId,
			label: this.getAttribute("label"),
			ariaLabel: this.getAttribute("aria-label"),
			placeholder: this.getAttribute("placeholder"),
			query: this.queryText,
			size: this.size,
			multiple: this.multiple,
			open: this.open,
			disabled: this.disabled,
			readonly: this.readonly,
			invalid: this.invalid,
			required: this.required,
			clearable: this.clearable,
			description: this.getAttribute("description"),
			error: this.getAttribute("error"),
			emptyText: this.emptyText,
			activeId: activeIndex >= 0 ? this.optionId(activeIndex) : null,
			showClear:
				this.clearable && this.interactive && (this.values.length > 0 || this.queryText.length > 0),
			options: matches.map((option, index) => ({
				id: this.optionId(index),
				value: option.value,
				label: optionLabel(option),
				selected: selected.has(option.value),
				active: option.value === this.activeValue,
			})),
			chips: this.multiple ? this.values.map((value) => ({ value, label: this.labelFor(value) })) : [],
		};
	}

	private applyIntent(intent: FragmentIntent, event: Event): void {
		if (intent.preventDefault) event.preventDefault();
		if (intent.stopPropagation) event.stopPropagation();
		if (intent.inputValue !== undefined) {
			this.queryText = intent.inputValue;
			this.queryDirty = true;
			this.openList();
			this.setActiveEdge("first");
			this.popup?.reposition();
			this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
			return;
		}
		if (intent.openMenu) {
			this.openList();
			this.setActiveEdge(intent.openMenu);
			return;
		}
		if (intent.expand && !this.open) this.openList();
		if (intent.focusValue !== undefined) {
			this.setActive(intent.focusValue);
			return;
		}
		if (intent.activateValue !== undefined) {
			this.pick(intent.activateValue);
			return;
		}
		if (intent.commitValue) {
			this.commitActive(intent.closeMenu === true);
			return;
		}
		if (intent.toggleOpen) {
			this.toggleList();
			if (intent.focusInput) this.input?.focus();
			return;
		}
		if (intent.clearValue) {
			this.clearAll();
			this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
		}
		if (intent.removeValue !== undefined) this.removeValue(intent.removeValue);
		if (intent.removeLast) {
			const current = this.values;
			if (current.length > 0) this.removeValue(current[current.length - 1]!);
		}
		if (intent.closeMenu) this.closeList();
		if (intent.reset) this.settleQuery();
		if (intent.focusInput) this.input?.focus();
	}

	/** Put the query back to what the selection says it should be: a single-select input typed in but never
	 * committed snaps back to the chosen label (or to empty), and a multi-select drops the query, since its
	 * chips already carry the answer. Free-text (`allow-custom`) keeps whatever was typed. */
	private settleQuery(): void {
		if (this.allowCustom) return;
		const next = this.selectedQuery();
		const wasFiltering = this.queryDirty;
		this.queryDirty = false;
		if (next === this.queryText) {
			if (wasFiltering) this.repaint();
			return;
		}
		this.queryText = next;
		this.repaint();
	}

	private selectedQuery(): string {
		if (this.multiple) return "";
		const first = this.values[0];
		return first !== undefined ? this.labelFor(first) : "";
	}

	private onFocusOut = (event: FocusEvent): void => {
		const next = event.relatedTarget as Node | null;
		if (next && (this.contains(next) || this.root.contains(next))) return;
		if (this.open) this.closeList();
		this.settleQuery();
	};

	/** The panel closed on its own — a light-dismiss, an Escape, a click outside — so the element follows the
	 * surface rather than fighting it, and remembers when, so the toggle can tell a dismissal's tail from a
	 * fresh press. */
	private onPopoverClose = (): void => {
		this.dismissedAt = this.now();
		if (!this.open) return;
		this.activeValue = "";
		this.setOpenSilently(false);
		this.repaint();
	};

	/** A pointer landing on the option list must never take focus off the input: the listbox is not a
	 * focusable widget in this pattern, and the blur would close the panel before the click resolved. */
	private onListPointerDown = (event: Event): void => {
		event.preventDefault();
	};

	/** An `<input>` fires a bubbling `select` of its own whenever the user drags across its text. That is a
	 * text selection, not a choice, and in light DOM (where no shadow boundary stops it) it would otherwise
	 * reach a consumer listening for the combobox's own `select` — and any overlay that closes on one. It is
	 * stopped inside the control; the element's own `select` is dispatched from the host, above this. */
	private onNativeSelect = (event: Event): void => {
		event.stopPropagation();
	};

	/** Wire the seams the fragment cannot declare: the popup's own close (so element state follows the
	 * surface), the focus-preserving pointer guard on the list, and the focusout that closes the whole thing
	 * when focus finally leaves. Guarded per node, so a re-render never double-binds. */
	private wire(): void {
		if (!this.hostWired) {
			this.hostWired = true;
			this.addEventListener("focusout", this.onFocusOut as EventListener);
		}
		const pop = this.popup;
		if (pop && pop !== this.wiredPopover) {
			this.wiredPopover?.removeEventListener("close", this.onPopoverClose);
			this.wiredPopover = pop;
			pop.addEventListener("close", this.onPopoverClose);
		}
		const list = this.list;
		if (list && list !== this.wiredList) {
			this.wiredList?.removeEventListener("mousedown", this.onListPointerDown);
			this.wiredList = list;
			list.addEventListener("mousedown", this.onListPointerDown);
		}
		const control = this.control;
		if (control && control !== this.wiredControl) {
			this.wiredControl?.removeEventListener("select", this.onNativeSelect);
			this.wiredControl = control;
			control.addEventListener("select", this.onNativeSelect);
		}
	}

	/** The input's live `.value` stops tracking the `value` attribute the moment the user types in it, so a
	 * programmatic change (a commit, a clear, a revert) has to be written to the property. While the user is
	 * typing the two already agree, so this never fights the caret. */
	private syncInputValue(): void {
		const input = this.input;
		if (input && input.value !== this.queryText) input.value = this.queryText;
	}

	/**
	 * Form participation. In light DOM the mirrored hidden inputs *are* the submitted value — one per
	 * selection, so a multi-select posts the array the way a native multi-`<select>` does. Behind a shadow root
	 * those inputs are invisible to the form, so `ElementInternals` carries the value across the boundary
	 * instead. Neither renders: this is plumbing, not chrome, and it stays in the element.
	 */
	private syncFormValue(): void {
		const values = this.values;
		this.syncHiddenInputs(values, this.name);
		if (this.internals && this.isShadow()) {
			try {
				this.internals.setFormValue(values.join(","));
			} catch {
				/* an environment without a form-value surface still has the mirrored inputs */
			}
		}
		this.syncValidity();
	}

	private syncValidity(): void {
		if (!this.internals) return;
		const input = this.input ?? undefined;
		try {
			if (this.invalid) {
				this.internals.setValidity({ customError: true }, this.getAttribute("error") ?? "Invalid value", input);
			} else if (this.required && this.values.length === 0) {
				this.internals.setValidity({ valueMissing: true }, "Please select a value.", input);
			} else {
				this.internals.setValidity({});
			}
		} catch {
			/* validity is advisory here; the mirrored inputs still carry the value */
		}
	}

	private isShadow(): boolean {
		return (this.root as unknown as Node) !== (this as unknown as Node);
	}

	private syncHiddenInputs(values: string[], name: string | null): void {
		for (const node of [...this.root.querySelectorAll<HTMLInputElement>("input[data-form-value]")]) {
			node.remove();
		}
		if (!name || values.length === 0 || typeof document === "undefined") return;
		for (const value of values) {
			const hidden = document.createElement("input");
			hidden.type = "hidden";
			hidden.name = name;
			hidden.value = value;
			hidden.setAttribute("data-form-value", "");
			this.root.appendChild(hidden);
		}
	}

	private forwardNativeAttrs(): void {
		const input = this.input;
		if (input) forwardNativeInputAttrs(this, input);
	}

	private warnIfUnnamed(): void {
		const hasLabel = (this.getAttribute("label") ?? "").length > 0;
		const hasAria = !!this.getAttribute("aria-label") || (this.getAttribute("placeholder") ?? "").length > 0;
		if (!hasLabel && !hasAria) {
			console.warn(
				"xtyle-combobox: the input has no accessible name. Provide a `label`, an `aria-label`, or at least a `placeholder`.",
			);
		}
	}

	private afterApply(): void {
		this.wire();
		this.syncInputValue();
		this.forwardNativeAttrs();
		this.syncFormValue();
	}

	attributeChangedCallback(name: string): void {
		if (!this.root.firstChild) return;
		if (name === "value" || name === "values" || name === "multiple") {
			this.selectionProp = null;
			if (!this.queryDirty) this.queryText = this.selectedQuery();
		}
		if (name === "open") {
			if (!this.settingOpen) this.syncOpen();
			return;
		}
		this.render();
	}

	/** Follow a declaratively-set `open` (the attribute, a binding's prop) onto the real popup. */
	private syncOpen(): void {
		const pop = this.popup;
		if (!pop) return;
		if (this.open && !pop.open) this.openList();
		else if (!this.open && pop.open) this.closeList();
		else this.render();
	}

	override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.wiredList?.removeEventListener("mousedown", this.onListPointerDown);
		this.wiredControl?.removeEventListener("select", this.onNativeSelect);
		this.wiredPopover?.removeEventListener("close", this.onPopoverClose);
		this.wiredList = null;
		this.wiredControl = null;
		this.wiredPopover = null;
	}

	protected template(): string {
		return "";
	}

	protected override render(): void {
		this.adoptComponentSheet();
		const first = !this.root.firstChild;
		this.fragment.ensureScaffold(comboboxHostCss);
		if (first) {
			this.queryText = this.selectedQuery();
			this.warnIfUnnamed();
		}
		this.fragment.update(this.bindings);
	}

	formDisabledCallback(disabled: boolean): void {
		this.disabled = disabled;
	}

	formResetCallback(): void {
		this.selectionProp = null;
		this.queryText = this.selectedQuery();
		this.queryDirty = false;
		this.closeList();
	}
}

/** Read a value list off the `values` attribute: a JSON array (what the bindings emit) or a plain
 * comma-separated string (what a hand-written HTML author reaches for). */
export function parseValueList(raw: string): string[] {
	const trimmed = raw.trim();
	if (trimmed.length === 0) return [];
	if (trimmed.startsWith("[")) return normalizeFieldOptions(trimmed).map((option) => option.value);
	return trimmed
		.split(",")
		.map((part) => part.trim())
		.filter((part) => part.length > 0);
}

function sameValues(a: readonly string[], b: readonly string[]): boolean {
	return a.length === b.length && a.every((value, index) => value === b[index]);
}

/** `CSS.escape` where it exists (every browser), a conservative fallback where it does not (a test DOM), so
 * an option value carrying a quote can never break out of the attribute selector. */
function cssEscape(value: string): string {
	if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(value);
	return value.replace(/["\\]/g, "\\$&");
}

define("xtyle-combobox", XtyleCombobox);

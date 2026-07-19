import { escapeAttr, escapeHtml } from "../escape.js";
import { linearNav } from "../../collection/nav-reducer.js";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, text: string): void;
}

interface ComboboxOption {
	id?: string;
	value?: string;
	label?: string;
	selected?: boolean;
	active?: boolean;
}

interface ComboboxChip {
	value?: string;
	label?: string;
}

interface ComboboxBindings {
	inputId?: string;
	listId?: string;
	descriptionId?: string;
	errorId?: string;
	label?: string | null;
	ariaLabel?: string | null;
	placeholder?: string | null;
	query?: string;
	size?: string;
	multiple?: boolean;
	open?: boolean;
	disabled?: boolean;
	readonly?: boolean;
	invalid?: boolean;
	required?: boolean;
	clearable?: boolean;
	description?: string | null;
	error?: string | null;
	emptyText?: string;
	activeId?: string | null;
	options?: ComboboxOption[];
	chips?: ComboboxChip[];
	showClear?: boolean;
}

interface EventPayload {
	dataset?: Record<string, string>;
	value?: string;
	key?: string;
	disabled?: boolean;
}

interface NavContext {
	open?: boolean;
	multiple?: boolean;
	allowCustom?: boolean;
	values?: string[];
	activeValue?: string;
	query?: string;
	selectedCount?: number;
}

interface Intent {
	openMenu?: "first" | "last";
	closeMenu?: boolean;
	toggleOpen?: boolean;
	expand?: boolean;
	focusValue?: string;
	activateValue?: string;
	activateLabel?: string;
	commitValue?: boolean;
	clearValue?: boolean;
	removeValue?: string;
	removeLast?: boolean;
	inputValue?: string;
	focusInput?: boolean;
	reset?: boolean;
	preventDefault?: boolean;
	stopPropagation?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: ComboboxBindings, ops: OpsBuilder) => void) => void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

const CHECK_GLYPH =
	`<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" ` +
	`stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5l3.5 3.5L13 4.5" /></svg>`;

const REMOVE_GLYPH =
	`<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" ` +
	`stroke-linecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>`;

function rootClass(b: ComboboxBindings): string {
	const size = b.size ?? "md";
	return [
		"xtyle-combobox",
		b.invalid && "xtyle-combobox--invalid",
		b.disabled && "xtyle-combobox--disabled",
		b.readonly && "xtyle-combobox--readonly",
		b.multiple && "xtyle-combobox--multiple",
		b.open && "xtyle-combobox--open",
		size !== "md" && `xtyle-combobox--${size}`,
	]
		.filter(Boolean)
		.join(" ");
}

function describedBy(b: ComboboxBindings): string {
	const description = b.description ?? "";
	const error = b.error ?? "";
	return [
		description.length > 0 ? b.descriptionId : null,
		b.invalid && error.length > 0 ? b.errorId : null,
	]
		.filter(Boolean)
		.join(" ");
}

function optionsHtml(b: ComboboxBindings): string {
	let out = "";
	for (const option of b.options ?? []) {
		const value = option.value ?? "";
		const label = option.label ?? value;
		const selected = option.selected === true;
		const check =
			`<span class="xtyle-combobox__check" part="check"${selected ? "" : " hidden"} aria-hidden="true">${CHECK_GLYPH}</span>`;
		out +=
			`<li class="xtyle-combobox__option" part="option" role="option" id="${escapeAttr(option.id ?? "")}" ` +
			`data-option data-value="${escapeAttr(value)}" data-label="${escapeAttr(label)}" ` +
			`aria-selected="${selected}" data-active="${option.active === true}">` +
			`<span class="xtyle-combobox__option-label">${escapeHtml(label)}</span>${check}</li>`;
	}
	return out;
}

function chipsHtml(b: ComboboxBindings): string {
	let out = "";
	for (const chip of b.chips ?? []) {
		const value = chip.value ?? "";
		const label = chip.label ?? value;
		out +=
			`<span class="xtyle-combobox__chip" part="chip" data-chip data-value="${escapeAttr(value)}">` +
			`<span class="xtyle-combobox__chip-label">${escapeHtml(label)}</span>` +
			`<button type="button" class="xtyle-combobox__chip-remove" part="chip-remove" tabindex="-1" ` +
			`data-chip-remove data-value="${escapeAttr(value)}" aria-label="Remove ${escapeAttr(label)}">${REMOVE_GLYPH}</button>` +
			`</span>`;
	}
	return out;
}

/**
 * One paint for both lifecycles: every piece of the combobox's chrome is an attribute, a text node, or
 * a children swap, so an update never rebuilds the scaffold — which matters more here than elsewhere,
 * because the popover the listbox floats in is a real element in this fragment and a remount would tear
 * the open panel out from under the user mid-keystroke.
 */
function paint(b: ComboboxBindings, ops: OpsBuilder): void {
	const inputId = b.inputId ?? "xtyle-combobox-input";
	const listId = b.listId ?? "xtyle-combobox-list";
	const label = b.label ?? "";
	const description = b.description ?? "";
	const error = b.error ?? "";
	const open = b.open === true;
	const disabled = b.disabled === true;
	const readonly = b.readonly === true;
	const required = b.required === true;
	const invalid = b.invalid === true;
	const options = b.options ?? [];
	const describes = describedBy(b);
	const star = required
		? `<span class="xtyle-combobox__required" part="required" aria-hidden="true">*</span>`
		: "";

	ops.setAttr(".xtyle-combobox", "class", rootClass(b));

	ops.replaceChildren("[data-label]", `${escapeHtml(label)}${star}`);
	ops.setAttr("[data-label]", "for", inputId);
	ops.setAttr("[data-label]", "hidden", label.length > 0 ? "" : "hidden");

	ops.setAttr("[data-input]", "id", inputId);
	ops.setAttr("[data-input]", "placeholder", b.placeholder ?? "");
	ops.setAttr("[data-input]", "aria-controls", listId);
	ops.setAttr("[data-input]", "aria-expanded", String(open));
	ops.setAttr("[data-input]", "aria-activedescendant", open ? (b.activeId ?? "") : "");
	ops.setAttr("[data-input]", "aria-invalid", String(invalid));
	ops.setAttr("[data-input]", "aria-required", required ? "true" : "");
	ops.setAttr("[data-input]", "aria-describedby", describes);
	ops.setAttr("[data-input]", "aria-label", label.length === 0 ? (b.ariaLabel ?? b.placeholder ?? "") : "");
	ops.setAttr("[data-input]", "disabled", disabled ? "disabled" : "");
	ops.setAttr("[data-input]", "readonly", readonly ? "readonly" : "");
	ops.setAttr("[data-input]", "value", b.query ?? "");

	ops.replaceChildren("[data-chips]", chipsHtml(b));
	ops.setAttr("[data-chips]", "hidden", (b.chips ?? []).length > 0 ? "" : "hidden");

	ops.setAttr("[data-clear]", "hidden", b.showClear === true ? "" : "hidden");
	ops.setAttr("[data-toggle]", "disabled", disabled || readonly ? "disabled" : "");
	ops.setAttr("[data-toggle]", "aria-label", open ? "Hide options" : "Show options");

	ops.setText("[data-description]", description);
	ops.setAttr("[data-description]", "id", b.descriptionId ?? "");
	ops.setAttr("[data-description]", "hidden", description.length > 0 ? "" : "hidden");

	ops.setText("[data-error]", error);
	ops.setAttr("[data-error]", "id", b.errorId ?? "");
	ops.setAttr("[data-error]", "hidden", invalid && error.length > 0 ? "" : "hidden");

	ops.setAttr("[data-list]", "id", listId);
	ops.setAttr("[data-list]", "aria-multiselectable", b.multiple === true ? "true" : "");
	ops.setAttr("[data-list]", "aria-label", label.length > 0 ? label : (b.ariaLabel ?? "Options"));
	ops.replaceChildren("[data-list]", optionsHtml(b));

	// only ever shown against an open panel: a closed combobox renders no options at all, so the
	// pre-hydration (zero-JS) paint would otherwise read "No matches" under an untouched input
	ops.setText("[data-empty]", b.emptyText ?? "No matches");
	ops.setAttr("[data-empty]", "hidden", open && options.length === 0 ? "" : "hidden");
}

hooks.fragment.mount("combobox", (bindings, ops) => {
	paint(bindings, ops);
});

hooks.fragment.update("combobox", (bindings, ops) => {
	paint(bindings, ops);
});

xript.exports.register("inputKeydown", (payload: unknown, context: unknown): Intent => {
	const e = payload as EventPayload;
	const ctx = (context ?? {}) as NavContext;
	const open = ctx.open === true;
	const values = ctx.values ?? [];
	const active = ctx.activeValue ?? "";
	const query = ctx.query ?? "";
	// The linear axis over the open option list, via the shared core, reported as the combobox's
	// `focusValue` intent (the element moves aria-activedescendant, not real focus).
	const move = (key: string): Intent => {
		const navItems = values.map((value) => ({ key: value }));
		const target = linearNav(navItems, active, key, { orientation: "vertical", wrap: true, homeEnd: true }).focus;
		return target !== undefined ? { focusValue: target, preventDefault: true } : { preventDefault: true };
	};
	switch (e.key) {
		case "ArrowDown":
			return open ? move("ArrowDown") : { openMenu: "first", preventDefault: true };
		case "ArrowUp":
			return open ? move("ArrowUp") : { openMenu: "last", preventDefault: true };
		case "Home":
			return open && values.length > 0 ? move("Home") : {};
		case "End":
			return open && values.length > 0 ? move("End") : {};
		case "Enter":
			// a closed list with nothing to commit leaves Enter alone, so it still submits the form
			if (!open && !(ctx.allowCustom === true && query.trim().length > 0)) return {};
			return { commitValue: true, preventDefault: true };
		case "Escape":
			if (open) return { closeMenu: true, preventDefault: true, stopPropagation: true };
			return query.length > 0 ? { reset: true, preventDefault: true, stopPropagation: true } : {};
		case "Tab": {
			// Tab is "take this and move on": it commits what the list is pointing at, the way Enter would, and
			// never preventDefaults, so focus still leaves for the next control
			if (!open) return {};
			const hasCommit = active.length > 0 || (ctx.allowCustom === true && query.trim().length > 0);
			return hasCommit ? { commitValue: true, closeMenu: true } : { closeMenu: true };
		}
		case "Backspace":
			return ctx.multiple === true && query.length === 0 && (ctx.selectedCount ?? 0) > 0
				? { removeLast: true }
				: {};
		default:
			return {};
	}
});

xript.exports.register("inputChanged", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	return { inputValue: e.value ?? "" };
});

xript.exports.register("optionClick", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	const value = e.dataset?.value;
	if (value === undefined) return {};
	return { activateValue: value, activateLabel: e.dataset?.label, stopPropagation: true };
});

xript.exports.register("toggleClick", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	if (e.disabled) return {};
	return { toggleOpen: true, focusInput: true, preventDefault: true, stopPropagation: true };
});

xript.exports.register("clearClick", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	if (e.disabled) return {};
	return { clearValue: true, focusInput: true, preventDefault: true, stopPropagation: true };
});

xript.exports.register("chipRemove", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	const value = e.dataset?.value;
	if (value === undefined) return {};
	return { removeValue: value, focusInput: true, preventDefault: true, stopPropagation: true };
});

xript.exports.register("controlClick", (): Intent => {
	return { expand: true, focusInput: true };
});

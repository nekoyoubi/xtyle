import { escapeAttr, escapeHtml } from "../escape.js";
import { escapeSelectorValue } from "../selector-escape.js";
import { linearNav } from "../../collection/nav-reducer.js";
import type { NavItem } from "../../collection/roving.js";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface ListAction {
	id: string;
	label: string;
	icon?: string;
	disabled?: boolean;
}

interface ListItem {
	value: string;
	label: string;
	disabled?: boolean;
	lead?: string;
	trail?: string;
	actions?: ListAction[];
}

interface ListBindings {
	items?: ListItem[];
	interaction?: string;
	selection?: string;
	orientation?: string;
	size?: string;
	selectedKeys?: string[];
	rovingValue?: string | null;
	label?: string | null;
	labelledby?: string | null;
	ariaLabel?: string | null;
	elementId?: string;
}

interface EventPayload {
	dataset?: Record<string, string>;
	key?: string;
	disabled?: boolean;
	ariaDisabled?: string;
	ctrlKey?: boolean;
	shiftKey?: boolean;
	metaKey?: boolean;
}

interface ListNavContext {
	navItems: NavItem[];
	interaction: string;
	selection: string;
	orientation: string;
}

interface Intent {
	select?: string;
	selectMode?: "replace" | "toggle" | "range";
	activate?: string;
	focus?: string;
	emit?: { type: string; detail?: unknown };
	preventDefault?: boolean;
	stopPropagation?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: ListBindings, ops: OpsBuilder) => void) => void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

function isSelectable(bindings: ListBindings): boolean {
	return bindings.interaction === "selectable" && (bindings.selection ?? "none") !== "none";
}
function isRoving(bindings: ListBindings): boolean {
	return (bindings.interaction ?? "navigational") !== "static";
}

function rootClass(bindings: ListBindings): string {
	const size = bindings.size ?? "md";
	const orientation = bindings.orientation ?? "vertical";
	return [
		"xtyle-list",
		`xtyle-list--${orientation}`,
		size !== "md" && `xtyle-list--${size}`,
		`xtyle-list--${bindings.interaction ?? "navigational"}`,
	]
		.filter(Boolean)
		.join(" ");
}

function itemBody(item: ListItem, bindings: ListBindings): string {
	const lead = item.lead
		? `<span class="xtyle-list__lead" part="lead"><xtyle-icon name="${escapeAttr(item.lead)}"></xtyle-icon></span>`
		: "";
	const label = `<span class="xtyle-list__label" part="label">${escapeHtml(item.label)}</span>`;
	const trail = item.trail ? `<span class="xtyle-list__trail" part="trail">${escapeHtml(item.trail)}</span>` : "";
	const actionable = bindings.interaction === "actionable";
	const actions =
		actionable && item.actions && item.actions.length
			? `<span class="xtyle-list__actions" part="actions">${item.actions
					.map((a) => {
						const disabled = a.disabled ? " disabled data-disabled=\"true\"" : "";
						return `<button type="button" class="xtyle-list__action" part="item-action" data-action="${escapeAttr(a.id)}" data-value="${escapeAttr(item.value)}" aria-label="${escapeAttr(a.label)}" title="${escapeAttr(a.label)}" tabindex="-1"${disabled}>${escapeHtml(a.icon ?? a.label)}</button>`;
					})
					.join("")}</span>`
			: "";
	return `${lead}${label}${trail}${actions}`;
}

function items(bindings: ListBindings): string {
	const list = bindings.items ?? [];
	const selectable = isSelectable(bindings);
	const roving = isRoving(bindings);
	const selected = new Set(bindings.selectedKeys ?? []);
	const rovingValue = bindings.rovingValue ?? null;
	const role = selectable ? "option" : "listitem";
	return list
		.map((item) => {
			const disabled = item.disabled ?? false;
			const disabledAttr = disabled ? ' aria-disabled="true" data-disabled="true"' : "";
			const selAttr = selectable ? ` aria-selected="${String(selected.has(item.value))}"` : "";
			const tabindex = roving ? (!disabled && item.value === rovingValue ? "0" : "-1") : "";
			const tabAttr = roving ? ` tabindex="${tabindex}"` : "";
			return `<li class="xtyle-list__item" part="item" role="${role}" data-value="${escapeAttr(item.value)}"${selAttr}${disabledAttr}${tabAttr}>${itemBody(item, bindings)}</li>`;
		})
		.join("");
}

function listInner(bindings: ListBindings): string {
	const selectable = isSelectable(bindings);
	const listRole = selectable ? "listbox" : "list";
	const multi = selectable && (bindings.selection === "multi" || bindings.selection === "range");
	const multiAttr = multi ? ' aria-multiselectable="true"' : "";
	const labelledby = bindings.labelledby ?? null;
	const labelText = bindings.label ?? null;
	const ariaLabel = bindings.ariaLabel ?? null;
	const labelId = `${bindings.elementId ?? "xtyle-list"}-label`;
	const orientation = bindings.orientation === "horizontal" ? ' aria-orientation="horizontal"' : "";
	const name = labelledby
		? ` aria-labelledby="${escapeAttr(labelledby)}"`
		: labelText
			? ` aria-labelledby="${escapeAttr(labelId)}"`
			: ariaLabel
				? ` aria-label="${escapeAttr(ariaLabel)}"`
				: "";
	const heading = labelText
		? `<span class="xtyle-list__title" part="title" id="${escapeAttr(labelId)}">${escapeHtml(labelText)}</span>`
		: "";
	return `${heading}<ul class="${rootClass(bindings)}" part="list" role="${listRole}"${name}${multiAttr}${orientation}>${items(bindings)}</ul>`;
}

hooks.fragment.mount("list", (bindings, ops) => {
	ops.replaceChildren("[data-root]", listInner(bindings));
});

hooks.fragment.update("list", (bindings, ops) => {
	const selectable = isSelectable(bindings);
	const roving = isRoving(bindings);
	const selected = new Set(bindings.selectedKeys ?? []);
	const rovingValue = bindings.rovingValue ?? null;
	ops.setAttr('[role="listbox"], [role="list"]', "class", rootClass(bindings));
	for (const item of bindings.items ?? []) {
		const sel = `[data-value="${escapeSelectorValue(item.value)}"]`;
		if (selectable) ops.setAttr(sel, "aria-selected", String(selected.has(item.value)));
		if (roving) ops.setAttr(sel, "tabindex", !item.disabled && item.value === rovingValue ? "0" : "-1");
	}
});

function selectMode(e: EventPayload): "replace" | "toggle" | "range" {
	if (e.shiftKey) return "range";
	if (e.ctrlKey || e.metaKey) return "toggle";
	return "replace";
}

xript.exports.register("selectItem", (payload: unknown, context: unknown): Intent => {
	const e = payload as EventPayload;
	const ctx = context as ListNavContext;
	if (e.disabled || e.ariaDisabled === "true") return {};
	const value = e.dataset?.value;
	if (!value) return {};
	if (ctx.interaction === "selectable" && ctx.selection !== "none") {
		return { select: value, selectMode: selectMode(e), focus: value };
	}
	if (ctx.interaction === "static") return {};
	return { activate: value, focus: value };
});

xript.exports.register("itemAction", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	if (e.dataset?.disabled === "true") return { stopPropagation: true, preventDefault: true };
	const action = e.dataset?.action;
	const value = e.dataset?.value;
	if (!action || value === undefined) return { stopPropagation: true };
	return { emit: { type: "list-action", detail: { value, action } }, stopPropagation: true, preventDefault: true };
});

xript.exports.register("navKeydown", (payload: unknown, context: unknown): Intent => {
	const e = payload as EventPayload;
	const ctx = context as ListNavContext;
	if (e.disabled || e.ariaDisabled === "true") return {};
	const current = e.dataset?.value ?? "";
	const orientation = ctx.orientation === "horizontal" ? "horizontal" : "vertical";
	const move = linearNav(ctx.navItems, current, e.key ?? "", { orientation, homeEnd: true });
	if (move.focus !== undefined) return { focus: move.focus, preventDefault: true, stopPropagation: true };
	if (move.activate) {
		if (ctx.interaction === "selectable" && ctx.selection !== "none") {
			const mode = ctx.selection === "single" ? "replace" : "toggle";
			return { select: current, selectMode: mode, preventDefault: true };
		}
		if (ctx.interaction === "static") return { preventDefault: true };
		return { activate: current, preventDefault: true };
	}
	if (move.handled) return { preventDefault: true, stopPropagation: true };
	return {};
});

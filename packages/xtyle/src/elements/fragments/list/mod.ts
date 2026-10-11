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
	trail?: string | string[];
	actions?: ListAction[];
	heading?: boolean;
	checked?: boolean;
	tone?: string;
	description?: string;
	badge?: Array<{ text: string; tone?: string }>;
	separator?: boolean;
	trailTone?: string;
	accelerator?: string;
	variant?: string;
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
	checkedLabel?: string;
	uncheckedLabel?: string;
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

const TRAIL_PARTS = ['part="trail trail-1"', 'part="trail trail-2"', 'part="trail trail-3"'];
const TRAIL_PARTS_BEYOND = 'part="trail"';

function checkMark(item: ListItem): string {
	if (typeof item.checked !== "boolean") return "";
	const icon = item.checked ? "--border--check-s60" : "--border";
	return `<span class="xtyle-list__check" part="check" aria-hidden="true"><xtyle-icon name="${icon}"></xtyle-icon></span>`;
}

function checkState(item: ListItem, bindings: ListBindings): string {
	if (typeof item.checked !== "boolean" || isSelectable(bindings)) return "";
	return `<span class="xtyle-list__state" part="state">, ${escapeHtml(item.checked ? (bindings.checkedLabel ?? "checked") : (bindings.uncheckedLabel ?? "not checked"))}</span>`;
}

function itemBody(item: ListItem, bindings: ListBindings): string {
	const lead = item.lead
		? `<span class="xtyle-list__lead" part="lead"><xtyle-icon name="${escapeAttr(item.lead)}"></xtyle-icon></span>`
		: "";
	const labelSpan = `<span class="xtyle-list__label" part="label">${acceleratedLabel(item)}</span>`;
	const label = item.description
		? `<span class="xtyle-list__content" part="content">${labelSpan}<span class="xtyle-list__description" part="description" id="${escapeAttr(descriptionId(item, bindings))}">${escapeHtml(item.description)}</span></span>`
		: labelSpan;
	const badges = (item.badge ?? [])
		.map((b) => `<span class="xtyle-list__badge${b.tone ? ` xtyle-list__badge--${escapeAttr(b.tone)}` : ""}" part="badge">${escapeHtml(b.text)}</span>`)
		.join("");
	const trails = typeof item.trail === "string" ? [item.trail] : (item.trail ?? []);
	const trail = trails
		.map((text, i) => `<span class="xtyle-list__trail${trailToneClass(item)}" ${TRAIL_PARTS[i] ?? TRAIL_PARTS_BEYOND}>${escapeHtml(text)}</span>`)
		.join("");
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
	return `${checkMark(item)}${lead}${label}${badges}${checkState(item, bindings)}${trail}${actions}`;
}

function acceleratedLabel(item: ListItem): string {
	const at = item.accelerator ? item.label.toLowerCase().indexOf(item.accelerator.toLowerCase()) : -1;
	if (at < 0 || !item.accelerator) return escapeHtml(item.label);
	const end = at + item.accelerator.length;
	return `${escapeHtml(item.label.slice(0, at))}<span class="xtyle-list__accelerator" part="accelerator">${escapeHtml(item.label.slice(at, end))}</span>${escapeHtml(item.label.slice(end))}`;
}

function descriptionId(item: ListItem, bindings: ListBindings): string {
	return `${bindings.elementId ?? "xtyle-list"}-description-${(bindings.items ?? []).indexOf(item)}`;
}

function trailToneClass(item: ListItem): string {
	return item.trailTone ? ` xtyle-list__trail--${escapeAttr(item.trailTone)}` : "";
}

function toneClass(block: string, item: ListItem): string {
	const tone = item.tone ?? (item.variant && block === "xtyle-list__item" ? "accent" : undefined);
	return tone ? ` ${block}--${escapeAttr(tone)}` : "";
}

function itemRow(item: ListItem, bindings: ListBindings): string {
	if (item.separator) return `<li class="xtyle-list__separator" part="separator" role="none" aria-hidden="true"></li>`;
	const selectable = isSelectable(bindings);
	const roving = isRoving(bindings);
	const selected = new Set(bindings.selectedKeys ?? []);
	const rovingValue = bindings.rovingValue ?? null;
	const role = selectable ? "option" : "listitem";
	const disabled = item.disabled ?? false;
	const disabledAttr = disabled ? ' aria-disabled="true" data-disabled="true"' : "";
	const selAttr = selectable ? ` aria-selected="${String(selected.has(item.value))}"` : "";
	const tabindex = roving ? (!disabled && item.value === rovingValue ? "0" : "-1") : "";
	const tabAttr = roving ? ` tabindex="${tabindex}"` : "";
	const checkedAttr = typeof item.checked === "boolean" ? ` data-checked="${String(item.checked)}"${selectable ? ` aria-checked="${String(item.checked)}"` : ""}` : "";
	const describedAttr = item.description ? ` aria-describedby="${escapeAttr(descriptionId(item, bindings))}"` : "";
	const shortcutAttr = item.accelerator ? ` aria-keyshortcuts="${escapeAttr(item.accelerator)}"` : "";
	const variantClass = item.variant ? ` xtyle-list__item--${escapeAttr(item.variant)}` : "";
	return `<li class="xtyle-list__item${toneClass("xtyle-list__item", item)}${variantClass}" part="item" role="${role}" data-value="${escapeAttr(item.value)}"${selAttr}${checkedAttr}${describedAttr}${shortcutAttr}${disabledAttr}${tabAttr}>${itemBody(item, bindings)}</li>`;
}

function group(heading: ListItem, members: ListItem[], index: number, bindings: ListBindings): string {
	const selectable = isSelectable(bindings);
	const headingId = `${bindings.elementId ?? "xtyle-list"}-heading-${index}`;
	const groupRole = selectable ? "group" : "listitem";
	const membersRole = selectable ? "none" : "list";
	const rows = members.map((item) => itemRow(item, bindings)).join("");
	return (
		`<li class="xtyle-list__group${toneClass("xtyle-list__group", heading)}" part="group" role="${groupRole}" aria-labelledby="${escapeAttr(headingId)}" data-heading="${escapeAttr(heading.value)}">` +
		`<span class="xtyle-list__heading" part="heading" id="${escapeAttr(headingId)}">${escapeHtml(heading.label)}</span>` +
		`<ul class="xtyle-list__group-items" part="group-items" role="${membersRole}">${rows}</ul>` +
		`</li>`
	);
}

function items(bindings: ListBindings): string {
	const list = bindings.items ?? [];
	let html = "";
	let index = 0;
	while (index < list.length && !list[index]!.heading) html += itemRow(list[index++]!, bindings);
	while (index < list.length) {
		const heading = list[index]!;
		const start = ++index;
		while (index < list.length && !list[index]!.heading) index++;
		html += group(heading, list.slice(start, index), start - 1, bindings);
	}
	return html;
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
	ops.setAttr('[part="list"]', "class", rootClass(bindings));
	for (const item of bindings.items ?? []) {
		if (item.heading || item.separator) continue;
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

import { escapeAttr, escapeHtml } from "../escape.js";
import { linearNav } from "../../collection/nav-reducer.js";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, text: string): void;
}

interface MenuItem {
	label?: string;
	value?: string;
	disabled?: boolean;
	hint?: string;
	intent?: "danger" | "default";
	separator?: true;
	heading?: string;
}

interface MenuBindings {
	items?: MenuItem[];
	label?: string | null;
	open?: boolean;
	context?: boolean;
	popupId?: string;
}

interface EventPayload {
	dataset?: Record<string, string>;
	key?: string;
	disabled?: boolean;
	ariaDisabled?: string;
}

interface NavContext {
	enabledValues: string[];
}

interface Intent {
	openMenu?: "first" | "last";
	closeMenu?: boolean;
	returnFocus?: boolean;
	activateValue?: string;
	activateLabel?: string;
	activateIndex?: number;
	focusValue?: string;
	preventDefault?: boolean;
	stopPropagation?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: MenuBindings, ops: OpsBuilder) => void) => void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

function triggerLabel(bindings: MenuBindings): string {
	return bindings.label ?? "Menu";
}

function action(item: MenuItem): string {
	const label = item.label ?? "";
	const value = item.value ?? label;
	const disabledAttr = item.disabled ? ` aria-disabled="true"` : "";
	const intentAttr = item.intent === "danger" ? ` data-intent="danger"` : "";
	const hint = item.hint
		? `<span class="xtyle-menu__item-hint" part="item-hint" aria-hidden="true">${escapeHtml(item.hint)}</span>`
		: "";
	return (
		`<button type="button" class="xtyle-menu__item" part="item" role="menuitem" tabindex="-1"${disabledAttr}${intentAttr} ` +
		`data-value="${escapeAttr(value)}" data-label="${escapeAttr(label)}">` +
		`<span class="xtyle-menu__item-label">${escapeHtml(label)}</span>${hint}</button>`
	);
}

function items(bindings: MenuBindings): string {
	let out = "";
	let groupOpen = false;
	const closeGroup = (): void => {
		if (groupOpen) {
			out += "</div>";
			groupOpen = false;
		}
	};
	for (const item of bindings.items ?? []) {
		if (item.heading !== undefined) {
			closeGroup();
			out +=
				`<div class="xtyle-menu__group" role="group" aria-label="${escapeAttr(item.heading)}">` +
				`<div class="xtyle-menu__heading" aria-hidden="true">${escapeHtml(item.heading)}</div>`;
			groupOpen = true;
			continue;
		}
		if (item.separator) {
			out += `<div class="xtyle-menu__separator" role="separator"></div>`;
			continue;
		}
		out += action(item);
	}
	closeGroup();
	return out;
}

hooks.fragment.mount("menu", (bindings, ops) => {
	const label = triggerLabel(bindings);
	const popupId = bindings.popupId ?? "xtyle-menu-popup";
	const open = bindings.open ?? false;
	const context = bindings.context ?? false;
	ops.setAttr("[data-root]", "data-context", context ? "true" : "");
	ops.setAttr("[data-trigger]", "hidden", context ? "hidden" : "");
	ops.setAttr("[data-trigger]", "aria-controls", popupId);
	ops.setAttr("[data-trigger]", "popovertarget", popupId);
	ops.setAttr("[data-trigger]", "aria-expanded", String(open));
	ops.setText("[data-trigger]", label);
	ops.setAttr("[data-popup]", "id", popupId);
	ops.setAttr("[data-popup]", "aria-label", label);
	ops.replaceChildren("[data-items]", items(bindings));
});

hooks.fragment.update("menu", (bindings, ops) => {
	ops.setAttr("[data-trigger]", "aria-expanded", String(bindings.open ?? false));
});

xript.exports.register("triggerKeydown", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	switch (e.key) {
		case "Enter":
		case " ":
		case "Spacebar":
		case "ArrowDown":
			return { openMenu: "first", preventDefault: true };
		case "ArrowUp":
			return { openMenu: "last", preventDefault: true };
		default:
			return {};
	}
});

xript.exports.register("itemClick", (payload: unknown, context: unknown): Intent => {
	const e = payload as EventPayload;
	if (e.disabled || e.ariaDisabled === "true") return {};
	const value = e.dataset?.value;
	if (value === undefined) return {};
	const ctx = context as NavContext;
	const index = (ctx?.enabledValues ?? []).indexOf(value);
	return { activateValue: value, activateLabel: e.dataset?.label, activateIndex: index };
});

xript.exports.register("itemKeydown", (payload: unknown, context: unknown): Intent => {
	const e = payload as EventPayload;
	const ctx = context as NavContext;
	const enabled = ctx?.enabledValues ?? [];
	const current = e.dataset?.value ?? "";
	const k = e.key ?? "";
	// Menu's own keys: activate the item, and the overlay's close / return-focus behavior.
	switch (k) {
		case "Enter":
		case " ":
		case "Spacebar": {
			if (e.disabled || e.ariaDisabled === "true") return { preventDefault: true };
			const value = e.dataset?.value;
			if (value === undefined) return { preventDefault: true };
			return {
				activateValue: value,
				activateLabel: e.dataset?.label,
				activateIndex: enabled.indexOf(value),
				preventDefault: true,
			};
		}
		case "Escape":
			return { closeMenu: true, returnFocus: true, preventDefault: true, stopPropagation: true };
		case "Tab":
			return { closeMenu: true, returnFocus: false };
	}
	// The roving axis (Up/Down/Home/End, wrapping) via the shared core, mapped to the menu's
	// `focusValue` intent (focus is a host effect the element applies).
	const navItems = enabled.map((value) => ({ key: value }));
	const move = linearNav(navItems, current, k, { orientation: "vertical", wrap: true, homeEnd: true });
	if (move.focus !== undefined) return { focusValue: move.focus, preventDefault: true };
	return {};
});

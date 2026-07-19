import { escapeAttr, escapeHtml } from "../escape.js";

import { linearNav } from "../../collection/nav-reducer.js";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	toggle(selector: string, condition: boolean): void;
}

interface TabItem {
	key: string;
	label: string;
	panelSlot?: string;
	panel?: string;
	disabled?: boolean;
}

interface TabsBindings {
	tabs?: TabItem[];
	activeId?: string | null;
	variant?: string;
	size?: string;
	sticky?: boolean;
	tablist?: boolean;
	label?: string | null;
	labelledby?: string | null;
	uid?: string;
}

interface EventPayload {
	dataset?: Record<string, string>;
	key?: string;
	disabled?: boolean;
	ariaDisabled?: string;
}

interface NavContext {
	keys: string[];
	enabledKeys: string[];
	activation: "automatic" | "manual";
}

interface SelectIntent {
	select?: string;
	focus?: string;
	preventDefault?: boolean;
}

declare const hooks: {
	fragment: { update(fragmentId: string, handler: (bindings: TabsBindings, ops: OpsBuilder) => void): void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

function selectedKey(bindings: TabsBindings): string | null {
	const tabs = bindings.tabs ?? [];
	const keys = tabs.map((t, i) => t.key ?? String(i));
	const requested = bindings.activeId ?? null;
	if (requested !== null) {
		const idx = keys.indexOf(requested);
		if (idx !== -1 && !tabs[idx]?.disabled) return requested;
	}
	const firstEnabled = tabs.findIndex((t) => !t.disabled);
	return keys[firstEnabled] ?? null;
}

function rootClass(bindings: TabsBindings): string {
	const variant = bindings.variant ?? "underline";
	const size = bindings.size ?? "md";
	const parts = ["xtyle-tabs", `xtyle-tabs--${variant}`];
	if (size !== "md") parts.push(`xtyle-tabs--${size}`);
	if (bindings.sticky) parts.push("xtyle-tabs--sticky");
	return parts.join(" ");
}

function tabButtons(bindings: TabsBindings, selected: string | null): string {
	const tabs = bindings.tabs ?? [];
	const uid = bindings.uid ?? "xtyle-tabs";
	return tabs
		.map((tab, i) => {
			const key = tab.key ?? String(i);
			const isSelected = key === selected;
			const tabindex = isSelected && !tab.disabled ? "0" : "-1";
			const disabledAttr = tab.disabled ? " disabled aria-disabled=\"true\"" : "";
			// In tablist mode the element owns no panels, so there is nothing to reference.
			const controls = bindings.tablist ? "" : ` aria-controls="${escapeAttr(uid)}-panel-${i}"`;
			return (
				`<button class="xtyle-tabs__tab" part="tab" type="button" role="tab" id="${escapeAttr(uid)}-tab-${i}" ` +
				`data-key="${escapeAttr(key)}" aria-selected="${String(isSelected)}"${controls} ` +
				`tabindex="${tabindex}"${disabledAttr}>${escapeHtml(tab.label)}</button>`
			);
		})
		.join("");
}

function panels(bindings: TabsBindings, selected: string | null): string {
	const tabs = bindings.tabs ?? [];
	const uid = bindings.uid ?? "xtyle-tabs";
	return tabs
		.map((tab, i) => {
			const key = tab.key ?? String(i);
			const isSelected = key === selected;
			const hidden = isSelected ? "" : " hidden";
			const body = tab.panelSlot ? `<slot name="${escapeAttr(tab.panelSlot)}"></slot>` : (tab.panel ?? "");
			return (
				`<div class="xtyle-tabs__panel" part="panel" role="tabpanel" id="${escapeAttr(uid)}-panel-${i}" ` +
				`data-key="${escapeAttr(key)}" aria-labelledby="${escapeAttr(uid)}-tab-${i}" tabindex="0"${hidden}>${body}</div>`
			);
		})
		.join("");
}

/** Build the whole structure once — the expensive `replaceChildren` rebuild. */
hooks.fragment.mount("tabs", (bindings, ops) => {
	const selected = selectedKey(bindings);
	ops.setAttr(".xtyle-tabs", "class", rootClass(bindings));
	const tablistLabel = bindings.labelledby ?? bindings.label ?? "";
	const tablistAttr = bindings.labelledby ? "aria-labelledby" : "aria-label";
	if (tablistLabel) ops.setAttr("[data-tablist]", tablistAttr, tablistLabel);
	ops.replaceChildren("[data-tablist]", tabButtons(bindings, selected));
	ops.replaceChildren("[data-panels]", bindings.tablist ? "" : panels(bindings, selected));
});

/** A selection change — toggle state on the existing nodes, never rebuild them. */
hooks.fragment.update("tabs", (bindings, ops) => {
	const selected = selectedKey(bindings);
	ops.setAttr(".xtyle-tabs", "class", rootClass(bindings));
	const tabs = bindings.tabs ?? [];
	tabs.forEach((tab, i) => {
		const key = tab.key ?? String(i);
		const isSelected = key === selected;
		ops.setAttr(`[role="tab"][data-key="${escapeAttr(key)}"]`, "aria-selected", String(isSelected));
		ops.setAttr(`[role="tab"][data-key="${escapeAttr(key)}"]`, "tabindex", isSelected && !tab.disabled ? "0" : "-1");
		ops.toggle(`[role="tabpanel"][data-key="${escapeAttr(key)}"]`, isSelected);
	});
});

xript.exports.register("selectTab", (payload: unknown): SelectIntent => {
	const e = payload as EventPayload;
	if (e.disabled || e.ariaDisabled === "true") return {};
	const key = e.dataset?.key;
	return key ? { select: key, focus: key } : {};
});

xript.exports.register("navKeydown", (payload: unknown, context: unknown): SelectIntent => {
	const e = payload as EventPayload;
	const ctx = context as NavContext;
	const current = e.dataset?.key ?? "";
	const navItems = (ctx.enabledKeys ?? []).map((key) => ({ key }));
	const move = linearNav(navItems, current, e.key ?? "", { orientation: "both", wrap: true, homeEnd: true });
	if (move.focus !== undefined) {
		return ctx.activation === "automatic"
			? { select: move.focus, focus: move.focus, preventDefault: true }
			: { focus: move.focus, preventDefault: true };
	}
	// Enter/Space commits the focused tab in manual activation; automatic already selected on move.
	if (move.activate && ctx.activation === "manual" && current) {
		return { select: current, focus: current, preventDefault: true };
	}
	return {};
});

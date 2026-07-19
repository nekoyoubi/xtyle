import { escapeAttr } from "../escape.js";
import { renderIcon } from "../../../icons";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface NavTab {
	value: string;
	label: string;
	icon?: string;
	badge?: string | number | null;
}

interface BottomNavBindings {
	tabs?: NavTab[];
	value?: string;
	label?: string;
}

declare const hooks: {
	fragment: {
		[k: string]: (
			id: string,
			handler: (bindings: BottomNavBindings, ops: OpsBuilder) => void,
		) => void;
	};
};

/** With nothing selected yet, the first tab holds the stop, so the bar is still reachable. */
function activeValue(b: BottomNavBindings): string {
	const tabs = b.tabs ?? [];
	if (tabs.some((t) => t.value === b.value)) return b.value ?? "";
	return tabs[0]?.value ?? "";
}

function tabHtml(tab: NavTab, active: boolean): string {
	const icon = tab.icon
		? `<span class="xtyle-bottom-nav__icon" part="icon" aria-hidden="true">${renderIcon(tab.icon as never)}</span>`
		: "";
	const badge =
		tab.badge !== undefined && tab.badge !== null && tab.badge !== ""
			? `<span class="xtyle-bottom-nav__badge" part="badge">${escapeAttr(String(tab.badge))}</span>`
			: "";
	return (
		`<button type="button" class="xtyle-bottom-nav__item" part="item" role="tab"` +
		` data-value="${escapeAttr(tab.value)}" aria-selected="${active ? "true" : "false"}"` +
		// A roving tabindex: the bar is one tab stop and the arrows move within it, so a keyboard user
		// doesn't tab past every section to leave the nav.
		` tabindex="${active ? "0" : "-1"}">` +
		icon +
		`<span class="xtyle-bottom-nav__label" part="label">${escapeAttr(tab.label)}</span>` +
		badge +
		`</button>`
	);
}

function navHtml(b: BottomNavBindings): string {
	const active = activeValue(b);
	const items = (b.tabs ?? []).map((tab) => tabHtml(tab, tab.value === active)).join("");
	return (
		`<div class="xtyle-bottom-nav" part="bar" role="tablist" aria-label="${escapeAttr(b.label ?? "Sections")}">` +
		items +
		`</div>`
	);
}

// The bar renders from data and holds no consumer slots, so a full repaint on update is safe and keeps
// selection, roving tabindex, and aria in one place.
function render(bindings: BottomNavBindings, ops: OpsBuilder): void {
	ops.replaceChildren("[data-bottom-nav]", navHtml(bindings));
}

hooks.fragment.mount("bottom-nav", render);
hooks.fragment.update("bottom-nav", render);

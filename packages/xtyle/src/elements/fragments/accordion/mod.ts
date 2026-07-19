import { escapeAttr, escapeHtml } from "../escape.js";

import { renderIcon } from "../../../icons";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	toggle(selector: string, condition: boolean): void;
	addClass(selector: string, className: string): void;
	removeClass(selector: string, className: string): void;
}

interface Section {
	header: string;
	panel?: string;
	panelSlot?: string;
	value?: string;
	disabled?: boolean;
}

interface AccordionBindings {
	sections?: Section[];
	openKeys?: string[];
	size?: string;
	headingLevel?: number;
	uid?: string;
}

interface EventPayload {
	dataset?: Record<string, string>;
	key?: string;
	disabled?: boolean;
	ariaDisabled?: string;
}

interface ToggleContext {
	multiple: boolean;
	openKeys: string[];
}

interface NavContext {
	enabledKeys: string[];
}

interface Intent {
	open?: string[];
	toggledKey?: string;
	isOpen?: boolean;
	focus?: string;
	preventDefault?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: AccordionBindings, ops: OpsBuilder) => void) => void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

// The inline glyph is the zero-JS fallback: `<xtyle-icon>` only paints once the custom element
// upgrades, and the `static` render never loads the runtime. Once it does upgrade, the icon's
// shadow root has no `<slot>`, so this light child stops rendering and the fragment-backed glyph
// takes over.
const CHEVRON =
	'<xtyle-icon class="xtyle-accordion__chevron" part="chevron" name="chevron-down" aria-hidden="true">' +
	renderIcon("chevron-down") +
	"</xtyle-icon>";

function accordionClass(bindings: AccordionBindings): string {
	const size = bindings.size ?? "md";
	return size === "md" ? "xtyle-accordion" : `xtyle-accordion xtyle-accordion--${size}`;
}

function headingLevel(bindings: AccordionBindings): number {
	const level = Number(bindings.headingLevel);
	return level >= 1 && level <= 6 ? Math.floor(level) : 3;
}

function items(bindings: AccordionBindings): string {
	const sections = bindings.sections ?? [];
	const open = new Set(bindings.openKeys ?? []);
	const uid = bindings.uid ?? "xtyle-accordion";
	const level = headingLevel(bindings);
	return sections
		.map((section, i) => {
			const key = section.value ?? String(i);
			const isOpen = open.has(key);
			const triggerId = `${uid}-h-${i}`;
			const panelId = `${uid}-p-${i}`;
			const disabledAttr = section.disabled ? " disabled aria-disabled=\"true\"" : "";
			const body = section.panelSlot ? `<slot name="${escapeAttr(section.panelSlot)}"></slot>` : (section.panel ?? "");
			return (
				`<div class="xtyle-accordion__item${isOpen ? " is-open" : ""}" part="item" data-key="${key}">` +
				`<h${level} class="xtyle-accordion__heading" part="heading">` +
				`<button class="xtyle-accordion__trigger" part="trigger" type="button" id="${triggerId}" ` +
				`data-key="${key}" aria-expanded="${String(isOpen)}" aria-controls="${panelId}"${disabledAttr}>` +
				`<span class="xtyle-accordion__label">${escapeHtml(section.header)}</span>${CHEVRON}</button></h${level}>` +
				`<div class="xtyle-accordion__panel" part="panel" id="${panelId}" data-key="${key}" role="region" ` +
				`aria-labelledby="${triggerId}"${isOpen ? "" : " hidden"}>` +
				`<div class="xtyle-accordion__content">${body}</div></div></div>`
			);
		})
		.join("");
}

hooks.fragment.mount("accordion", (bindings, ops) => {
	ops.setAttr(".xtyle-accordion", "class", accordionClass(bindings));
	ops.replaceChildren("[data-items]", items(bindings));
});

hooks.fragment.update("accordion", (bindings, ops) => {
	const open = new Set(bindings.openKeys ?? []);
	(bindings.sections ?? []).forEach((section, i) => {
		const key = section.value ?? String(i);
		const isOpen = open.has(key);
		ops.setAttr(`.xtyle-accordion__trigger[data-key="${key}"]`, "aria-expanded", String(isOpen));
		ops.toggle(`.xtyle-accordion__panel[data-key="${key}"]`, isOpen);
		if (isOpen) ops.addClass(`.xtyle-accordion__item[data-key="${key}"]`, "is-open");
		else ops.removeClass(`.xtyle-accordion__item[data-key="${key}"]`, "is-open");
	});
});

xript.exports.register("toggleSection", (payload: unknown, context: unknown): Intent => {
	const e = payload as EventPayload;
	const ctx = context as ToggleContext;
	if (e.disabled || e.ariaDisabled === "true") return {};
	const key = e.dataset?.key;
	if (!key) return {};
	const open = new Set(ctx.openKeys ?? []);
	const wasOpen = open.has(key);
	if (ctx.multiple) {
		if (wasOpen) open.delete(key);
		else open.add(key);
	} else {
		open.clear();
		if (!wasOpen) open.add(key);
	}
	return { open: [...open], toggledKey: key, isOpen: open.has(key) };
});

xript.exports.register("navKeydown", (payload: unknown, context: unknown): Intent => {
	const e = payload as EventPayload;
	const ctx = context as NavContext;
	const k = e.key ?? "";
	const current = e.dataset?.key ?? "";
	const enabled = ctx.enabledKeys ?? [];
	const here = enabled.indexOf(current);
	let target: string | undefined;
	if (k === "ArrowDown") target = enabled[(here + 1) % enabled.length];
	else if (k === "ArrowUp") target = enabled[(here - 1 + enabled.length) % enabled.length];
	else if (k === "Home") target = enabled[0];
	else if (k === "End") target = enabled[enabled.length - 1];
	else return {};
	if (target === undefined) return {};
	return { focus: target, preventDefault: true };
});

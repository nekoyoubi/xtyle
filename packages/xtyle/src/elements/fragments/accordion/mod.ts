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
	headerSlot?: string;
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
	/** Single-open mode names the `<details>` group so the browser enforces exclusivity itself. */
	multiple?: boolean;
	/** The roster glyph drawn as the disclosure marker. */
	chevronIcon?: string;
	/** That glyph's body, resolved against the live roster by the trusted host. */
	chevronBody?: string | null;
}

interface EventPayload {
	dataset?: Record<string, string>;
	key?: string;
	disabled?: boolean;
	ariaDisabled?: string;
	/** The `<details>` open state, read after the browser's own toggle. */
	open?: boolean;
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

// INFO: `<xtyle-icon>` paints nothing until the custom element upgrades, and its shadow root has
// no `<slot>`, so this light child renders only pre-upgrade and never doubles up after.
function chevron(bindings: AccordionBindings): string {
	const name = bindings.chevronIcon ?? "chevron-down";
	return (
		`<xtyle-icon class="xtyle-accordion__chevron" part="chevron" name="${escapeAttr(name)}" aria-hidden="true">` +
		renderIcon(name, { body: bindings.chevronBody }) +
		"</xtyle-icon>"
	);
}

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
	const chev = chevron(bindings);
	return sections
		.map((section, i) => {
			const key = section.value ?? String(i);
			const isOpen = open.has(key);
			const triggerId = `${uid}-h-${i}`;
			const panelId = `${uid}-p-${i}`;
			const disabledAttr = section.disabled ? " aria-disabled=\"true\"" : "";
			const body = section.panelSlot ? `<slot name="${escapeAttr(section.panelSlot)}"></slot>` : (section.panel ?? "");
			const bodyRegion = section.panelSlot ? ` data-slot="${escapeAttr(section.panelSlot)}"` : "";
			const label = section.headerSlot
				? `<slot name="${escapeAttr(section.headerSlot)}"></slot>`
				: escapeHtml(section.header);
			const labelRegion = section.headerSlot ? ` data-slot="${escapeAttr(section.headerSlot)}"` : "";
			const group = bindings.multiple ? "" : ` name="${escapeAttr(uid)}-group"`;
			return (
				`<details class="xtyle-accordion__item" part="item" data-key="${key}"${group}${isOpen ? " open" : ""}>` +
				`<summary class="xtyle-accordion__trigger" part="trigger" id="${triggerId}" ` +
				`data-key="${key}" aria-controls="${panelId}"${disabledAttr}>` +
				`<h${level} class="xtyle-accordion__heading" part="heading">` +
				`<span class="xtyle-accordion__label"${labelRegion}>${label}</span></h${level}>${chev}</summary>` +
				`<div class="xtyle-accordion__panel" part="panel" id="${panelId}" data-key="${key}" role="region" ` +
				`aria-labelledby="${triggerId}">` +
				`<div class="xtyle-accordion__content"${bodyRegion}>${body}</div></div></details>`
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
		ops.setAttr(`.xtyle-accordion__item[data-key="${key}"]`, "open", open.has(key) ? "open" : "");
	});
});

/**
 * A disabled section: `<summary>` has no native disabled state, so the click is cancelled before the
 * browser acts on it. This is the only case where the component overrides the platform's toggle.
 */
xript.exports.register("guardDisabled", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	const blocked = e.disabled === true || e.ariaDisabled === "true";
	return blocked ? { preventDefault: true } : {};
});

/**
 * The browser has already opened or closed the section by the time this runs — `toggle` fires after
 * the fact. So this reports rather than decides: it reads the new state off the element and hands
 * back the key set, which the host stores and re-emits as the component's own `toggle` event. Single-
 * open exclusivity is enforced by the shared `name` on the `<details>` group, not here, which is why
 * the closing sibling needs no bookkeeping — the browser already closed it and fired its own `toggle`.
 */
xript.exports.register("syncToggle", (payload: unknown, context: unknown): Intent => {
	const e = payload as EventPayload;
	const ctx = context as ToggleContext;
	const key = e.dataset?.key;
	if (!key) return {};
	const nowOpen = e.open === true;
	const open = new Set(ctx.openKeys ?? []);
	if (nowOpen) {
		if (!ctx.multiple) open.clear();
		open.add(key);
	} else open.delete(key);
	return { open: [...open], toggledKey: key, isOpen: nowOpen };
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

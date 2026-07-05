interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	toggle(selector: string, condition: boolean): void;
}

interface PanelBindings {
	title?: string | null;
	level?: number;
	variant?: string;
	open?: boolean;
	scrollable?: boolean;
	hasActions?: boolean;
	titleId?: string;
	label?: string | null;
}

interface Intent {
	toggleOpen?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: PanelBindings, ops: OpsBuilder) => void) => void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

const MARKER =
	'<span class="xtyle-panel__marker" part="marker" aria-hidden="true">' +
	'<svg viewBox="0 0 24 24" width="1em" height="1em"><path fill="currentColor" d="M9 6l6 6-6 6V6Z" /></svg></span>';

function level(b: PanelBindings): number {
	const raw = Number(b.level);
	return raw >= 1 && raw <= 6 ? Math.trunc(raw) : 2;
}

function isCollapsible(b: PanelBindings): boolean {
	return (b.variant ?? "default") === "collapsible";
}

// `data-slot="actions"` rides alongside the native `<slot>`: the host reads `hasSlotted("actions")`
// to decide header presence/naming, and under the auto-light (Astro SSR) render there is no shadow
// root to read host children from — so the binding-composed content must stay capturable by marker.
const ACTIONS_SLOT = `<span class="xtyle-slot" data-slot="actions"><slot name="actions"></slot></span>`;

function hasHeader(b: PanelBindings): boolean {
	return (b.title ?? "") !== "" || b.hasActions === true;
}

function panelClass(b: PanelBindings): string {
	const variant = b.variant ?? "default";
	return ["xtyle-panel", variant !== "default" && `xtyle-panel--${variant}`, b.scrollable && "xtyle-panel--scroll"]
		.filter(Boolean)
		.join(" ");
}

function body(b: PanelBindings): string {
	const bodyAttrs = b.scrollable
		? ` tabindex="0" role="region" aria-label="${b.title || b.label || "Scrollable content"}"`
		: "";
	return (
		`<div class="xtyle-panel__body" part="body"${bodyAttrs}><slot></slot></div>` +
		`<div class="xtyle-panel__footer" part="footer"><slot name="footer"></slot></div>`
	);
}

function inner(b: PanelBindings): string {
	const uid = b.titleId ?? "xtyle-panel";
	if (isCollapsible(b)) {
		const expanded = b.open ? "true" : "false";
		return (
			`<div class="xtyle-panel__header xtyle-panel__header--toggle" part="header">` +
			`<button class="xtyle-panel__toggle" part="toggle" type="button" aria-expanded="${expanded}" ` +
			`aria-controls="${uid}-region">${MARKER}` +
			`<span class="xtyle-panel__title" part="title" id="${uid}">${b.title ?? ""}</span></button>` +
			`${ACTIONS_SLOT}</div>` +
			`<div class="xtyle-panel__collapse" part="collapse" id="${uid}-region" role="region" ` +
			`aria-labelledby="${uid}"${b.open ? "" : " hidden"}>${body(b)}</div>`
		);
	}
	const tag = `h${level(b)}`;
	const heading = b.title
		? `<${tag} class="xtyle-panel__title" part="title" id="${uid}">${b.title}</${tag}>`
		: "";
	const header = hasHeader(b)
		? `<header class="xtyle-panel__header" part="header">${heading}` +
			`<span class="xtyle-panel__spacer" part="spacer"></span>${ACTIONS_SLOT}</header>`
		: "";
	return `${header}${body(b)}`;
}

function applyName(bindings: PanelBindings, ops: OpsBuilder): void {
	const uid = bindings.titleId ?? "xtyle-panel";
	const named = !isCollapsible(bindings) && !!bindings.title;
	const labelled = !isCollapsible(bindings) && !bindings.title && !!bindings.label;
	ops.setAttr("[data-root]", "aria-labelledby", named ? uid : "");
	ops.setAttr("[data-root]", "aria-label", labelled ? (bindings.label ?? "") : "");
}

hooks.fragment.mount("panel", (bindings, ops) => {
	ops.setAttr("[data-root]", "class", panelClass(bindings));
	applyName(bindings, ops);
	ops.replaceChildren("[data-panel]", inner(bindings));
});

hooks.fragment.update("panel", (bindings, ops) => {
	ops.setAttr("[data-root]", "class", panelClass(bindings));
	applyName(bindings, ops);
	if (isCollapsible(bindings)) {
		const open = bindings.open === true;
		ops.setAttr(".xtyle-panel__toggle", "aria-expanded", String(open));
		ops.toggle(".xtyle-panel__collapse", open);
	}
});

xript.exports.register("togglePanel", (): Intent => {
	return { toggleOpen: true };
});

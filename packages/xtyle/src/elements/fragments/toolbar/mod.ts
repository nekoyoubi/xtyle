import { escapeAttr, escapeHtml } from "../escape.js";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, text: string): void;
}

interface ToolbarBindings {
	heading?: string | null;
	href?: string | null;
	size?: string;
	landmark?: boolean;
	sticky?: boolean;
	bare?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: ToolbarBindings, ops: OpsBuilder) => void) => void };
};

function toolbarClass(b: ToolbarBindings): string {
	const size = b.size ?? "md";
	return ["xtyle-toolbar", size !== "md" && `xtyle-toolbar--${size}`, b.sticky && "xtyle-toolbar--sticky", b.bare && "xtyle-toolbar--bare"]
		.filter(Boolean)
		.join(" ");
}

function titleMarkup(b: ToolbarBindings): string {
	const heading = b.heading ?? null;
	if (heading === null) return "";
	const href = b.href ?? null;
	if (href !== null) {
		return `<a class="xtyle-toolbar__title" part="title" href="${escapeAttr(href)}">${escapeHtml(heading)}</a>`;
	}
	return `<span class="xtyle-toolbar__title" part="title">${escapeHtml(heading)}</span>`;
}

function inner(b: ToolbarBindings): string {
	return (
		'<div class="xtyle-toolbar__group xtyle-toolbar__group--start" part="group"><slot name="start"></slot></div>' +
		titleMarkup(b) +
		"<slot></slot>" +
		'<div class="xtyle-toolbar__group xtyle-toolbar__group--center" part="group"><slot name="center"></slot></div>' +
		'<div class="xtyle-toolbar__group xtyle-toolbar__group--end" part="group"><slot name="end"></slot></div>'
	);
}

function toolbarHtml(b: ToolbarBindings): string {
	const tag = b.landmark ? "header" : "div";
	const nameAttr = b.landmark && b.heading ? ` aria-label="${escapeAttr(b.heading)}"` : "";
	return `<${tag} part="toolbar" class="${toolbarClass(b)}"${nameAttr}>${inner(b)}</${tag}>`;
}

hooks.fragment.mount("toolbar", (bindings, ops) => {
	ops.replaceChildren("[data-toolbar]", toolbarHtml(bindings));
});

hooks.fragment.update("toolbar", (bindings, ops) => {
	ops.setAttr(".xtyle-toolbar", "class", toolbarClass(bindings));
	const heading = bindings.heading ?? null;
	if (heading !== null) {
		ops.setText('[part="title"]', heading);
		const href = bindings.href ?? null;
		if (href !== null) ops.setAttr('[part="title"]', "href", href);
	}
	if (bindings.landmark) ops.setAttr('[part="toolbar"]', "aria-label", heading ?? "");
});

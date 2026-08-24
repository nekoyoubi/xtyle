import { escapeAttr, escapeHtml } from "../escape.js";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, text: string): void;
}

interface DialogBindings {
	size?: string;
	heading?: string | null;
	label?: string | null;
	labelledby?: string | null;
	closeLabel?: string | null;
	noCloseButton?: boolean;
	hasFooter?: boolean;
	elementId?: string;
}

interface EventPayload {
	disabled?: boolean;
	ariaDisabled?: string;
}

interface Intent {
	requestClose?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: DialogBindings, ops: OpsBuilder) => void) => void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

const CLOSE_ICON =
	'<svg viewBox="0 0 24 24" aria-hidden="true">' +
	'<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M6 6l12 12M18 6L6 18" /></svg>';

function dialogClass(b: DialogBindings): string {
	const size = b.size ?? "md";
	return ["xtyle-dialog", size !== "md" && `xtyle-dialog--${size}`].filter(Boolean).join(" ");
}

function titleId(b: DialogBindings): string {
	return `${b.elementId ?? "xtyle-dialog"}-title`;
}

function inner(b: DialogBindings): string {
	const heading = b.heading ?? null;
	const label = b.label ?? null;
	const labelledby = b.labelledby ?? null;
	const closeLabel = b.closeLabel ?? "Close";
	const showCloseButton = !b.noCloseButton;

	const labelAttr = labelledby
		? ` aria-labelledby="${escapeAttr(labelledby)}"`
		: heading
			? ` aria-labelledby="${titleId(b)}"`
			: label
				? ` aria-label="${escapeAttr(label)}"`
				: "";

	const closeButton = showCloseButton
		? `<button type="button" class="xtyle-dialog__close" part="close" aria-label="${escapeAttr(closeLabel)}">${CLOSE_ICON}</button>`
		: "";

	const titleMarkup = heading ? `<h2 class="xtyle-dialog__title" id="${titleId(b)}">${escapeHtml(heading)}</h2>` : "";

	const header = `<header class="xtyle-dialog__header" part="header"><slot name="header">${titleMarkup}</slot>${closeButton}</header>`;

	const footer = b.hasFooter
		? `<footer class="xtyle-dialog__footer" part="footer"><slot name="footer"></slot></footer>`
		: "";

	return (
		`<dialog class="${dialogClass(b)}" part="dialog"${labelAttr}>` +
		header +
		`<div class="xtyle-dialog__body" part="body"><slot></slot></div>` +
		footer +
		`</dialog>`
	);
}

hooks.fragment.mount("dialog", (bindings, ops) => {
	ops.replaceChildren("[data-dialog]", inner(bindings));
});

hooks.fragment.update("dialog", (bindings, ops) => {
	ops.setAttr(".xtyle-dialog", "class", dialogClass(bindings));
	if (bindings.heading) ops.setText(".xtyle-dialog__title", bindings.heading);
	if (bindings.labelledby) ops.setAttr(".xtyle-dialog", "aria-labelledby", bindings.labelledby);
	else if (!bindings.heading && bindings.label) ops.setAttr(".xtyle-dialog", "aria-label", bindings.label);
	if (bindings.closeLabel) ops.setAttr(".xtyle-dialog__close", "aria-label", bindings.closeLabel);
});

xript.exports.register("requestClose", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	if (e.disabled || e.ariaDisabled === "true") return {};
	return { requestClose: true };
});

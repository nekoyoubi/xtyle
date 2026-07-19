import { escapeAttr, escapeHtml } from "../escape.js";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	setText(selector: string, text: string): void;
}

interface SheetBindings {
	side?: string;
	size?: string;
	heading?: string | null;
	label?: string | null;
	labelledby?: string | null;
	closeLabel?: string | null;
	noCloseButton?: boolean;
	noGrabber?: boolean;
	nonModal?: boolean;
	elementId?: string;
	hasFooter?: boolean;
}

interface EventPayload {
	disabled?: boolean;
	ariaDisabled?: string;
}

interface Intent {
	requestClose?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: SheetBindings, ops: OpsBuilder) => void) => void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

const CLOSE_ICON =
	'<svg viewBox="0 0 24 24" aria-hidden="true">' +
	'<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M6 6l12 12M18 6L6 18" /></svg>';

function sheetClass(b: SheetBindings): string {
	const side = b.side ?? "bottom";
	const size = b.size ?? "md";
	return [
		"xtyle-sheet",
		`xtyle-sheet--${side}`,
		size !== "md" && `xtyle-sheet--${size}`,
		b.nonModal && "xtyle-sheet--non-modal",
	]
		.filter(Boolean)
		.join(" ");
}

function titleId(b: SheetBindings): string {
	return `${b.elementId ?? "xtyle-sheet"}-title`;
}

function inner(b: SheetBindings): string {
	const heading = b.heading ?? null;
	const label = b.label ?? null;
	const labelledby = b.labelledby ?? null;
	const closeLabel = b.closeLabel ?? "Close";

	const labelAttr = labelledby
		? ` aria-labelledby="${escapeAttr(labelledby)}"`
		: heading
			? ` aria-labelledby="${titleId(b)}"`
			: label
				? ` aria-label="${escapeAttr(label)}"`
				: "";

	const handle = b.noGrabber
		? ""
		: '<div class="xtyle-sheet__handle" part="handle" data-handle aria-hidden="true">' +
			'<span class="xtyle-sheet__grabber" part="grabber"></span></div>';

	const closeButton = b.noCloseButton
		? ""
		: `<button type="button" class="xtyle-sheet__close" part="close" aria-label="${escapeAttr(closeLabel)}">${CLOSE_ICON}</button>`;

	const titleMarkup = heading ? `<h2 class="xtyle-sheet__title" id="${titleId(b)}">${escapeHtml(heading)}</h2>` : "";

	const header =
		`<header class="xtyle-sheet__header" part="header" data-handle-region>` +
		`<slot name="header">${titleMarkup}</slot>${closeButton}</header>`;

	const panel =
		'<div class="xtyle-sheet__panel" part="panel">' +
		header +
		'<div class="xtyle-sheet__body" part="body" data-slot><slot></slot></div>' +
		// The footer keeps its `<slot>` whether filled or not, so `:empty` can never match it: a slot
		// is a child node, and the nodes assigned to it are not. Only the host knows, so it says, and
		// `data-slot` is how it sees the region at all under the auto-light (Astro SSR) render.
		`<footer class="xtyle-sheet__footer" part="footer" data-slot="footer"${b.hasFooter ? "" : " hidden"}><slot name="footer"></slot></footer>` +
		"</div>";

	return `<dialog class="${sheetClass(b)}" part="sheet"${labelAttr}>` + handle + panel + "</dialog>";
}

hooks.fragment.mount("sheet", (bindings, ops) => {
	ops.replaceChildren("[data-sheet]", inner(bindings));
});

hooks.fragment.update("sheet", (bindings, ops) => {
	ops.setAttr(".xtyle-sheet", "class", sheetClass(bindings));
	if (bindings.heading) ops.setText(".xtyle-sheet__title", bindings.heading);
});

xript.exports.register("requestClose", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	if (e.disabled || e.ariaDisabled === "true") return {};
	return { requestClose: true };
});

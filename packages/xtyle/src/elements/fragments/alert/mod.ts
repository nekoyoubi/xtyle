import { escapeAttr } from "../escape.js";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	toggle(selector: string, condition: boolean): void;
}

interface AlertBindings {
	tone?: string;
	severity?: string;
	variant?: string;
	dismissible?: boolean;
	dismissLabel?: string;
	hasTitle?: boolean;
	hasActions?: boolean;
}

interface EventPayload {
	key?: string;
}

interface Intent {
	dismiss?: boolean;
	preventDefault?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: AlertBindings, ops: OpsBuilder) => void) => void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

const TONE_ICONS: { [tone: string]: string } = {
	success: '<path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.1 14.2-4.1-4.1 1.4-1.4 2.7 2.7 5.6-5.6 1.4 1.4-7 7Z"/>',
	warn: '<path fill="currentColor" d="M12 2 1 21h22L12 2Zm0 5 .5 8h-1L11 7h2Zm-1 10h2v2h-2v-2Z"/>',
	danger: '<path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1 4h2v8h-2V6Zm0 10h2v2h-2v-2Z"/>',
	info: '<path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1 5h2v2h-2V7Zm0 4h2v6h-2v-6Z"/>',
};

const ASSERTIVE: { [severity: string]: boolean } = { danger: true, warn: true };

/** The severity drives the glyph + politeness (not the color). An explicit `severity` wins; else a
 * status-named `tone` implies its severity (back-compat); a non-status tone carries none; a bare
 * alert defaults to `info`. Returns `""` for no severity. */
function severityOf(b: AlertBindings): string {
	if (b.severity) return b.severity;
	if (b.tone) return TONE_ICONS[b.tone] ? b.tone : "";
	return "info";
}

function alertClass(b: AlertBindings): string {
	const variant = b.variant ?? "soft";
	const color = b.tone ?? severityOf(b) ?? "info";
	const noIcon = severityOf(b) ? "" : " xtyle-alert--noicon";
	return `xtyle-alert xtyle-alert--${variant} xtyle-alert--${color || "info"}${noIcon}`;
}

function iconSvg(b: AlertBindings): string {
	const path = TONE_ICONS[severityOf(b)];
	return path ? `<svg viewBox="0 0 24 24" width="1em" height="1em">${path}</svg>` : "";
}

function dismissButton(b: AlertBindings): string {
	if (!b.dismissible) return "";
	const label = b.dismissLabel ?? "Dismiss";
	return (
		`<button class="xtyle-alert__dismiss" part="dismiss" type="button" aria-label="${escapeAttr(label)}">` +
		'<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">' +
		'<path fill="currentColor" d="m12 10.6 5-5 1.4 1.4-5 5 5 5L17 18.4l-5-5-5 5L5.6 17l5-5-5-5L7 5.6l5 5Z"/></svg></button>'
	);
}

function role(b: AlertBindings): string {
	return ASSERTIVE[severityOf(b)] ? "alert" : "status";
}

function live(b: AlertBindings): string {
	return ASSERTIVE[severityOf(b)] ? "assertive" : "polite";
}

// Title and actions wrap a `<slot>`, so `:empty` can never match them: the slot is a child node, and
// the nodes assigned to it are not. Only the host can tell a filled slot from an unfilled one.
function toggleRegions(b: AlertBindings, ops: OpsBuilder): void {
	ops.toggle('[part="title"]', b.hasTitle === true);
	ops.toggle('[part="actions"]', b.hasActions === true);
}

hooks.fragment.mount("alert", (bindings, ops) => {
	ops.setAttr(".xtyle-alert", "class", alertClass(bindings));
	ops.setAttr("[data-root]", "role", role(bindings));
	ops.setAttr("[data-root]", "aria-live", live(bindings));
	ops.replaceChildren("[data-glyph]", iconSvg(bindings));
	ops.replaceChildren("[data-dismiss]", dismissButton(bindings));
	toggleRegions(bindings, ops);
});

hooks.fragment.update("alert", (bindings, ops) => {
	ops.setAttr(".xtyle-alert", "class", alertClass(bindings));
	ops.setAttr("[data-root]", "role", role(bindings));
	ops.setAttr("[data-root]", "aria-live", live(bindings));
	ops.replaceChildren("[data-glyph]", iconSvg(bindings));
	toggleRegions(bindings, ops);
});

xript.exports.register("dismiss", (): Intent => {
	return { dismiss: true };
});

xript.exports.register("keyDismiss", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	if (e.key === "Escape" || e.key === "Esc") return { dismiss: true, preventDefault: true };
	return {};
});

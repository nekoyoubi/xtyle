interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
}

interface ToastBindings {
	tone?: string;
	severity?: string;
	variant?: string;
	closable?: boolean;
	closeLabel?: string;
	actionLabel?: string | null;
}

interface Intent {
	dismiss?: boolean;
	emit?: { type: string };
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: ToastBindings, ops: OpsBuilder) => void) => void };
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
 * toast defaults to `info`. Returns `""` for no severity. */
function severityOf(b: ToastBindings): string {
	if (b.severity) return b.severity;
	if (b.tone) return TONE_ICONS[b.tone] ? b.tone : "";
	return "info";
}

function toastClass(b: ToastBindings): string {
	const variant = b.variant ?? "soft";
	const color = b.tone ?? severityOf(b) ?? "info";
	const noIcon = severityOf(b) ? "" : " xtyle-toast--noicon";
	return `xtyle-toast xtyle-toast--${variant} xtyle-toast--${color || "info"}${noIcon}`;
}

function iconSvg(b: ToastBindings): string {
	const path = TONE_ICONS[severityOf(b)];
	return path ? `<svg viewBox="0 0 24 24" width="1em" height="1em">${path}</svg>` : "";
}

function role(b: ToastBindings): string {
	return ASSERTIVE[severityOf(b)] ? "alert" : "status";
}

function live(b: ToastBindings): string {
	return ASSERTIVE[severityOf(b)] ? "assertive" : "polite";
}

function actionButton(b: ToastBindings): string {
	const label = b.actionLabel ?? null;
	if (!label) return "";
	return `<button class="xtyle-toast__action" part="action" type="button">${label}</button>`;
}

function closeButton(b: ToastBindings): string {
	if (!(b.closable ?? true)) return "";
	const label = b.closeLabel ?? "Dismiss";
	return (
		`<button class="xtyle-toast__close" part="close" type="button" aria-label="${label}">` +
		'<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">' +
		'<path fill="currentColor" d="m12 10.6 5-5 1.4 1.4-5 5 5 5L17 18.4l-5-5-5 5L5.6 17l5-5-5-5L7 5.6l5 5Z"/></svg></button>'
	);
}

hooks.fragment.mount("toast", (bindings, ops) => {
	ops.setAttr("[data-root]", "class", toastClass(bindings));
	ops.setAttr("[data-root]", "role", role(bindings));
	ops.setAttr("[data-root]", "aria-live", live(bindings));
	ops.replaceChildren("[data-icon]", iconSvg(bindings));
	ops.replaceChildren("[data-action]", actionButton(bindings));
	ops.replaceChildren("[data-close]", closeButton(bindings));
});

hooks.fragment.update("toast", (bindings, ops) => {
	ops.setAttr("[data-root]", "class", toastClass(bindings));
	ops.setAttr("[data-root]", "role", role(bindings));
	ops.setAttr("[data-root]", "aria-live", live(bindings));
	ops.replaceChildren("[data-icon]", iconSvg(bindings));
});

xript.exports.register("dismiss", (): Intent => {
	return { dismiss: true };
});

xript.exports.register("action", (): Intent => {
	return { emit: { type: "action" } };
});

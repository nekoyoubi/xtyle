import type { FullTone } from "../vocab.js";

/** The toast's color — any semantic role, accent variant, or named hue. */
export type ToastTone = FullTone;
/** The toast's meaning — drives the status glyph + live-region politeness, independent of color. */
export type ToastSeverity = "success" | "warn" | "danger" | "info";
export type ToastVariant = "soft" | "solid";

/** Severities that warrant an assertive live-region announcement. */
export const ASSERTIVE_SEVERITIES = new Set<string>(["danger", "warn"]);

/** Inline SVG path for each severity's status icon. */
export const SEVERITY_ICONS: Record<ToastSeverity, string> = {
	success: `<path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.1 14.2-4.1-4.1 1.4-1.4 2.7 2.7 5.6-5.6 1.4 1.4-7 7Z"/>`,
	warn: `<path fill="currentColor" d="M12 2 1 21h22L12 2Zm0 5 .5 8h-1L11 7h2Zm-1 10h2v2h-2v-2Z"/>`,
	danger: `<path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1 4h2v8h-2V6Zm0 10h2v2h-2v-2Z"/>`,
	info: `<path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1 5h2v2h-2V7Zm0 4h2v6h-2v-6Z"/>`,
};

/** The close-button SVG glyph, shared by the element render and the imperative push path. */
export const CLOSE_ICON = `<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true"><path fill="currentColor" d="m12 10.6 5-5 1.4 1.4-5 5 5 5L17 18.4l-5-5-5 5L5.6 17l5-5-5-5L7 5.6l5 5Z"/></svg>`;

/** Resolve the severity (meaning) from the color tone + explicit severity: an explicit `severity`
 * wins; else a status-named `tone` implies its severity (back-compat); a non-status tone carries
 * none; a bare toast defaults to `info`. Returns `""` for no severity. */
export function toastSeverity(tone?: string, severity?: string): ToastSeverity | "" {
	if (severity) return severity as ToastSeverity;
	if (tone) return tone in SEVERITY_ICONS ? (tone as ToastSeverity) : "";
	return "info";
}

/** The status-icon span for a severity — empty when there's no severity (a color-only toast). */
export function toastIconMarkup(severity: string): string {
	const path = SEVERITY_ICONS[severity as ToastSeverity];
	return path
		? `<span class="xtyle-toast__icon" part="icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="1em" height="1em">${path}</svg></span>`
		: "";
}

export interface ToastMarkupProps {
	tone?: ToastTone;
	severity?: ToastSeverity;
	variant?: ToastVariant;
	closable?: boolean;
	closeLabel?: string;
	actionLabel?: string;
}

/** The host-layout rule for a toast — the one `:host` rule shared by `styles()` and the SSR shadow. */
export const toastHostCss = ":host { display: block; }";

export function toastClass(props: ToastMarkupProps): string {
	const variant = props.variant ?? "soft";
	const severity = toastSeverity(props.tone, props.severity);
	const color = props.tone ?? severity ?? "info";
	return [
		"xtyle-toast",
		`xtyle-toast--${variant}`,
		`xtyle-toast--${color || "info"}`,
		severity ? "" : "xtyle-toast--noicon",
	]
		.filter(Boolean)
		.join(" ");
}

/**
 * The single source of a toast's shadow markup. The custom element renders it into
 * its shadow root at runtime; the `@xtyle/astro` binding emits the same string into a
 * declarative shadow root at build. Pure and DOM-free.
 */
export function toastMarkup(props: ToastMarkupProps): string {
	const severity = toastSeverity(props.tone, props.severity);
	const assertive = ASSERTIVE_SEVERITIES.has(severity);
	const role = assertive ? "alert" : "status";
	const live = assertive ? "assertive" : "polite";
	const actionLabel = props.actionLabel ?? null;
	const action = actionLabel
		? `<button class="xtyle-toast__action" part="action" type="button">${actionLabel}</button>`
		: "";
	const closable = props.closable ?? true;
	const close = closable
		? `<button class="xtyle-toast__close" part="close" type="button" aria-label="${props.closeLabel ?? "Dismiss"}">${CLOSE_ICON}</button>`
		: "";
	return `<div class="${toastClass(props)}" part="toast" role="${role}" aria-live="${live}" aria-atomic="true">${toastIconMarkup(severity)}<div class="xtyle-toast__body" part="body"><span class="xtyle-toast__message" part="message"><slot></slot></span>${action}</div>${close}</div>`;
}

export interface ToastRegionMarkupProps {
	placement?: string;
	label?: string;
}

/** The host-layout rule for a toast region — the one `:host` rule shared by `styles()` and the SSR shadow. */
export const toastRegionHostCss = ":host { display: contents; }";

export function toastRegionClass(props: ToastRegionMarkupProps): string {
	const placement = props.placement ?? "bottom-right";
	return ["xtyle-toast-region", placement !== "bottom-right" && `xtyle-toast-region--${placement}`]
		.filter(Boolean)
		.join(" ");
}

export function toastRegionMarkup(props: ToastRegionMarkupProps): string {
	const label = props.label ?? "Notifications";
	return `<div class="${toastRegionClass(props)}" part="toast-region" role="region" aria-label="${label}" aria-live="polite"><slot></slot></div>`;
}

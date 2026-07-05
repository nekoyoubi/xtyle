export interface PanelMarkupProps {
	title?: string;
	level?: number;
	variant?: "default" | "collapsible";
	open?: boolean;
	scrollable?: boolean;
	/** Whether the panel has a named-actions slot occupant, decided by the consumer (light-DOM query / `Astro.slots.has`). */
	hasActions?: boolean;
	/** Stable id seed for the title element and the collapsible region's `aria` wiring. */
	titleId: string;
}

/** The host-layout rule for a panel — the one `:host` rule, shared by the element's `styles()` and the SSR declarative shadow root. */
export const panelHostCss = ":host { display: block; }";

function level(props: PanelMarkupProps): number {
	const raw = props.level ?? 2;
	return raw >= 1 && raw <= 6 ? Math.trunc(raw) : 2;
}

function hasHeader(props: PanelMarkupProps): boolean {
	return (props.title ?? "") !== "" || props.hasActions === true;
}

export function panelClass(props: PanelMarkupProps): string {
	const variant = props.variant ?? "default";
	return [
		"xtyle-panel",
		variant !== "default" && `xtyle-panel--${variant}`,
		props.scrollable && "xtyle-panel--scroll",
	]
		.filter(Boolean)
		.join(" ");
}

function marker(): string {
	return `<span class="xtyle-panel__marker" part="marker" aria-hidden="true"><svg viewBox="0 0 24 24" width="1em" height="1em"><path fill="currentColor" d="M9 6l6 6-6 6V6Z" /></svg></span>`;
}

function titleHeading(props: PanelMarkupProps): string {
	const tag = `h${level(props)}`;
	return `<${tag} class="xtyle-panel__title" part="title" id="${props.titleId}">${props.title ?? ""}</${tag}>`;
}

function body(props: PanelMarkupProps): string {
	const bodyAttrs = props.scrollable
		? ` tabindex="0" role="region" aria-label="${props.title || "Scrollable content"}"`
		: "";
	return `<div class="xtyle-panel__body" part="body"${bodyAttrs}><slot></slot></div><div class="xtyle-panel__footer" part="footer"><slot name="footer"></slot></div>`;
}

/**
 * The single source of a panel's shadow markup. The custom element renders it into
 * its shadow root at runtime; the `@xtyle/astro` binding emits the same string into a
 * declarative shadow root at build. Both paths render one identical control from one
 * source — no per-binding reimplementation. Pure and DOM-free, so it is safe to
 * import in any environment (SSR included).
 */
export function panelMarkup(props: PanelMarkupProps): string {
	if ((props.variant ?? "default") === "collapsible") {
		const expanded = props.open ? "true" : "false";
		return `<section class="${panelClass(props)}" part="panel">
				<button class="xtyle-panel__toggle" part="header" type="button" aria-expanded="${expanded}" aria-controls="${props.titleId}-region">${marker()}<span class="xtyle-panel__title" part="title" id="${props.titleId}">${props.title ?? ""}</span><span class="xtyle-panel__spacer" part="spacer"></span><slot name="actions"></slot></button>
				<div class="xtyle-panel__collapse" id="${props.titleId}-region" role="region" aria-labelledby="${props.titleId}"${props.open ? "" : " hidden"}>${body(props)}</div>
			</section>`;
	}
	const header = hasHeader(props)
		? `<header class="xtyle-panel__header" part="header">${props.title ? titleHeading(props) : ""}<span class="xtyle-panel__spacer" part="spacer"></span><slot name="actions"></slot></header>`
		: "";
	const labelledBy = props.title ? ` aria-labelledby="${props.titleId}"` : "";
	return `<section class="${panelClass(props)}" part="panel"${labelledBy}>${header}${body(props)}</section>`;
}

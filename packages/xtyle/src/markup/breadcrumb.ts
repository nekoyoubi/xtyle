import type { Size, FullTone } from "../vocab.js";
import { escapeHtml, escapeAttr } from "./escape.js";

export interface BreadcrumbItem {
	label: string;
	href?: string;
	/** An opaque value for an in-app crumb: a non-current item with a `value` and no `href` renders as a
	 * button that fires the breadcrumb's `select` event instead of navigating, so a crumb can drive app
	 * state (select an ancestor node) rather than follow a URL. `href` wins when both are set. */
	value?: string;
	/** Hover text for the crumb, rendered as the cell's `title`: the fuller identity behind an
	 * abbreviated, truncated, or glyph label. It's the accessible description too (the visible label
	 * stays the accessible name), so the detail reaches assistive tech without renaming the crumb. */
	title?: string;
	current?: boolean;
}

export interface BreadcrumbMarkupProps {
	items?: BreadcrumbItem[];
	separator?: string;
	tone?: FullTone;
	size?: Size;
	label?: string;
}

/** The host-layout rule for a breadcrumb — the one `:host` rule, shared by the element's `styles()` and the SSR declarative shadow root. */
export const breadcrumbHostCss = ":host { display: block; }";

export function breadcrumbClass(props: BreadcrumbMarkupProps): string {
	const tone = props.tone ?? "accent";
	const size = props.size ?? "md";
	return ["xtyle-breadcrumb", `xtyle-breadcrumb--${tone}`, size !== "md" && `xtyle-breadcrumb--${size}`]
		.filter(Boolean)
		.join(" ");
}

function separatorMarkup(separator: string): string {
	return `<li class="xtyle-breadcrumb__separator" part="separator" aria-hidden="true">${escapeHtml(separator)}</li>`;
}

/** One crumb's inner cell: the current crumb is plain text, an `href` crumb is a link, a valued crumb
 * (no `href`, not current) is a button that fires `select`, and anything else is plain text. */
function crumbCell(item: BreadcrumbItem, isCurrent: boolean, label: string): string {
	const title = item.title ? ` title="${escapeAttr(item.title)}"` : "";
	if (isCurrent) return `<span class="xtyle-breadcrumb__current" part="item" aria-current="page"${title}>${label}</span>`;
	if (item.href) return `<a class="xtyle-breadcrumb__link" part="item" href="${escapeAttr(item.href)}"${title}>${label}</a>`;
	if (item.value !== undefined)
		return `<button type="button" class="xtyle-breadcrumb__link" part="item" data-value="${escapeAttr(item.value)}"${title}>${label}</button>`;
	return `<span class="xtyle-breadcrumb__current" part="item"${title}>${label}</span>`;
}

function inner(props: BreadcrumbMarkupProps): string {
	const items = props.items ?? [];
	if (items.length === 0) {
		return `<ol class="xtyle-breadcrumb__list" part="list"><slot></slot></ol>`;
	}
	const separator = props.separator ?? "/";
	const lastIndex = items.length - 1;
	const rows = items.map((item, index) => {
		const isCurrent = item.current === true || (item.current === undefined && index === lastIndex);
		const label = escapeHtml(item.label ?? "");
		const cell = crumbCell(item, isCurrent, label);
		const row = `<li class="xtyle-breadcrumb__item" part="item-wrap">${cell}</li>`;
		return index < lastIndex ? `${row}${separatorMarkup(separator)}` : row;
	});
	return `<ol class="xtyle-breadcrumb__list" part="list">${rows.join("")}</ol>`;
}

/**
 * The single source of a breadcrumb's shadow markup. The custom element renders it
 * into its shadow root at runtime; the `@xtyle/astro` binding emits the same string
 * into a declarative shadow root at build. Data-driven: pass the parsed `items`
 * array and the function maps over it exactly as the element does. Pure and
 * DOM-free, so it is safe to import in any environment (SSR included).
 */
export function breadcrumbMarkup(props: BreadcrumbMarkupProps): string {
	const label = props.label ?? "Breadcrumb";
	return `<nav part="breadcrumb" class="${breadcrumbClass(props)}" aria-label="${escapeAttr(label)}">${inner(props)}</nav>`;
}

import type { FullTone, Size } from "../vocab.js";
import { escapeAttr } from "./escape.js";

export interface PaginationMarkupProps {
	page?: number;
	total?: number;
	siblings?: number;
	boundaries?: number;
	/** A URL template with a `{page}` placeholder; when set, items render as links instead of buttons. */
	href?: string;
	tone?: FullTone;
	size?: Size;
	label?: string;
	prevLabel?: string;
	nextLabel?: string;
}

/** The host-layout rule for pagination — the one `:host` rule, shared by the element and the SSR shadow. */
export const paginationHostCss = ":host { display: block; }";

function span(lo: number, hi: number): number[] {
	const out: number[] = [];
	for (let n = lo; n <= hi; n++) out.push(n);
	return out;
}

/**
 * The visible page list for a pager: boundary pages at each end, a sibling window around the
 * current page, and an `"ellipsis"` marker wherever a gap is collapsed. The slot count stays
 * **constant** across every page of a given pager — when one side hugs the edge and needs no
 * ellipsis there, the window widens to fill the same width — so the control never reflows and
 * the prev/next arrows hold their position as you page. Falls back to the full run when
 * everything fits, so a small pager never shows a needless ellipsis. Pure and DOM-free.
 */
export function paginationRange(
	page: number,
	total: number,
	siblings = 1,
	boundaries = 1,
): (number | "ellipsis")[] {
	const safeTotal = Math.max(1, Math.floor(total));
	const current = Math.min(Math.max(1, Math.floor(page)), safeTotal);
	const sib = Math.max(0, Math.floor(siblings));
	const bound = Math.max(1, Math.floor(boundaries));

	const slots = bound * 2 + sib * 2 + 3;
	if (slots >= safeTotal) return span(1, safeTotal);

	const leftSibling = Math.max(current - sib, bound + 2);
	const rightSibling = Math.min(current + sib, safeTotal - bound - 1);
	const showLeftGap = leftSibling > bound + 2;
	const showRightGap = rightSibling < safeTotal - bound - 1;
	const edgeRun = bound + sib * 2 + 2;

	if (!showLeftGap && showRightGap) {
		return [...span(1, edgeRun), "ellipsis", ...span(safeTotal - bound + 1, safeTotal)];
	}
	if (showLeftGap && !showRightGap) {
		return [...span(1, bound), "ellipsis", ...span(safeTotal - edgeRun + 1, safeTotal)];
	}
	return [
		...span(1, bound),
		"ellipsis",
		...span(leftSibling, rightSibling),
		"ellipsis",
		...span(safeTotal - bound + 1, safeTotal),
	];
}

/** Substitute the `{page}` placeholder in an href template; falls back to appending when absent. */
export function paginationHref(template: string, page: number): string {
	return template.includes("{page}") ? template.replace(/\{page\}/g, String(page)) : `${template}${page}`;
}

export function paginationClass(props: PaginationMarkupProps): string {
	const tone = props.tone ?? "accent";
	const size = props.size ?? "md";
	return ["xtyle-pagination", `xtyle-pagination--${tone}`, size !== "md" && `xtyle-pagination--${size}`]
		.filter(Boolean)
		.join(" ");
}

const ARROW_PREV = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M10 3.5 5.5 8l4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ARROW_NEXT = `<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function control(
	rel: "prev" | "next",
	target: number,
	disabled: boolean,
	href: string | undefined,
	ariaLabel: string,
): string {
	const glyph = rel === "prev" ? ARROW_PREV : ARROW_NEXT;
	const cls = `xtyle-pagination__control xtyle-pagination__control--${rel}`;
	if (href && !disabled) {
		return `<a class="${cls}" part="control" href="${escapeAttr(paginationHref(href, target))}" rel="${rel}" aria-label="${escapeAttr(ariaLabel)}" data-page="${target}">${glyph}</a>`;
	}
	const dis = disabled ? " aria-disabled=\"true\"" : "";
	const dataPage = disabled ? "" : ` data-page="${target}"`;
	return `<button type="button" class="${cls}" part="control" aria-label="${escapeAttr(ariaLabel)}"${dis}${dataPage}>${glyph}</button>`;
}

function pageItem(n: number, current: number, href: string | undefined): string {
	const isCurrent = n === current;
	if (isCurrent) {
		return `<li class="xtyle-pagination__item" part="item-wrap"><span class="xtyle-pagination__page xtyle-pagination__page--current" part="page" aria-current="page">${n}</span></li>`;
	}
	const label = `Go to page ${n}`;
	const cell =
		href !== undefined
			? `<a class="xtyle-pagination__page" part="page" href="${escapeAttr(paginationHref(href, n))}" aria-label="${escapeAttr(label)}" data-page="${n}">${n}</a>`
			: `<button type="button" class="xtyle-pagination__page" part="page" aria-label="${escapeAttr(label)}" data-page="${n}">${n}</button>`;
	return `<li class="xtyle-pagination__item" part="item-wrap">${cell}</li>`;
}

function inner(props: PaginationMarkupProps): string {
	const total = Math.max(1, Math.floor(props.total ?? 1));
	const page = Math.min(Math.max(1, Math.floor(props.page ?? 1)), total);
	const { href } = props;
	const items = paginationRange(page, total, props.siblings ?? 1, props.boundaries ?? 1)
		.map((entry) =>
			entry === "ellipsis"
				? `<li class="xtyle-pagination__item" part="item-wrap"><span class="xtyle-pagination__ellipsis" part="ellipsis" aria-hidden="true">…</span></li>`
				: pageItem(entry, page, href),
		)
		.join("");
	const prev = control("prev", page - 1, page <= 1, href, props.prevLabel ?? "Previous page");
	const next = control("next", page + 1, page >= total, href, props.nextLabel ?? "Next page");
	return `${prev}<ol class="xtyle-pagination__list" part="list">${items}</ol>${next}`;
}

/**
 * The single source of a pagination control's shadow markup. The custom element renders it into
 * its shadow root at runtime; the `@xtyle/astro` binding emits the same string into a declarative
 * shadow root at build. Items are links when an `href` template is given (zero-JS navigation),
 * buttons otherwise (the element emits a `page-change` event on click). Pure and DOM-free.
 */
export function paginationMarkup(props: PaginationMarkupProps): string {
	const label = props.label ?? "Pagination";
	return `<nav part="pagination" class="${paginationClass(props)}" aria-label="${escapeAttr(label)}">${inner(props)}</nav>`;
}

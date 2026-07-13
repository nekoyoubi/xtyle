import type { Size, FullTone } from "../vocab.js";
import { escapeHtml, escapeAttr } from "./escape.js";

/** A trailing per-row control: a glyph and the accessible name it fires a `tree-action` with. */
export interface TreeAction {
	id: string;
	label: string;
	/** A short glyph or emoji shown on the button; `label` is its accessible name. */
	icon?: string;
	/** Render the button greyed and non-firing (a positional control disabled by context), instead of omitting it. */
	disabled?: boolean;
}

/** A trailing pill after a row's label — text with an optional tone, so a count and a status pill can each carry their own color. */
export interface TreeBadge {
	text: string;
	tone?: FullTone;
}

/** Normalize a node's `badge` (a string, a single `TreeBadge`, or a mix) into a list of toned pills. */
export function treeBadges(badge: TreeNode["badge"]): TreeBadge[] {
	if (badge == null) return [];
	const list = Array.isArray(badge) ? badge : [badge];
	return list.map((b) => (typeof b === "string" ? { text: b } : b));
}

export interface TreeNode {
	label: string;
	value?: string;
	href?: string;
	expanded?: boolean;
	/** Pin a branch open: forced expanded, no twisty, and no collapse path — a permanent section header.
	 * With an `href` it stays a navigable header (its row is a link); without one it is inert — not
	 * selectable, not a keyboard-focus stop — a pure label over its children. */
	locked?: boolean;
	selected?: boolean;
	disabled?: boolean;
	/** Trailing content after the label (a count or status), shown always. A plain string, a toned
	 * `TreeBadge`, or a list of them (a count plus a distinct status pill). Decorative (`aria-hidden`);
	 * put anything the row must announce in `label`. */
	badge?: string | TreeBadge | Array<string | TreeBadge>;
	/** Trailing action buttons revealed on hover/focus, each firing a `tree-action` (`detail: { value, action }`). Rendered on non-link rows only. */
	actions?: TreeAction[];
	children?: TreeNode[];
}

/** The trailing content after a row's label: badge pills, then hover-revealed action buttons (non-link rows only). */
export function treeTrailing(node: TreeNode, value: string, isLink: boolean): string {
	const badges = treeBadges(node.badge)
		.map(
			(b) =>
				`<span class="xtyle-tree__badge${b.tone ? ` xtyle-tree__badge--${b.tone}` : ""}" part="badge" aria-hidden="true">${escapeHtml(b.text)}</span>`,
		)
		.join("");
	const actionItems = !isLink && node.actions ? node.actions : [];
	const actions = actionItems.length
		? `<span class="xtyle-tree__actions" part="actions">${actionItems
				.map((a) => {
					const disabled = a.disabled ? ` disabled data-disabled="true"` : "";
					return `<button type="button" class="xtyle-tree__action" part="row-action" data-action="${escapeAttr(a.id)}" data-value="${escapeAttr(value)}" aria-label="${escapeAttr(a.label)}" title="${escapeAttr(a.label)}" tabindex="-1"${disabled}>${escapeHtml(a.icon ?? a.label)}</button>`;
				})
				.join("")}</span>`
		: "";
	return badges || actions ? `<span class="xtyle-tree__trailing">${badges}${actions}</span>` : "";
}

export interface TreeMarkupProps {
	items?: TreeNode[];
	size?: Size;
	label?: string | null;
	labelledby?: string | null;
}

/** The host-layout rule for a tree: the one `:host` rule, shared by the element's `styles()` and the SSR declarative shadow root. */
export const treeHostCss = ":host { display: block; }";

export function firstSelectedValue(nodes: TreeNode[]): string | null {
	for (const node of nodes) {
		if (node.selected) return node.value ?? node.label;
		if (node.children) {
			const found = firstSelectedValue(node.children);
			if (found !== null) return found;
		}
	}
	return null;
}

export function treeClass(props: TreeMarkupProps): string {
	const size = props.size ?? "md";
	return ["xtyle-tree", size !== "md" && `xtyle-tree--${size}`].filter(Boolean).join(" ");
}

function buildNodes(nodes: TreeNode[], level: number, selectedValue: string | null): string {
	return nodes
		.map((node) => {
			const hasChildren = !!(node.children && node.children.length);
			const value = node.value ?? node.label;
			const locked = (node.locked ?? false) && hasChildren;
			const expanded = locked ? true : (node.expanded ?? false);
			const selected = value === selectedValue;
			const disabled = node.disabled ?? false;
			const twisty = hasChildren && !locked
				? `<span class="xtyle-tree__twisty" aria-hidden="true"><svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 6l6 6-6 6" /></svg></span>`
				: `<span class="xtyle-tree__twisty xtyle-tree__twisty--leaf" aria-hidden="true"></span>`;
			const label = `<span class="xtyle-tree__label">${escapeHtml(node.label)}</span>`;
			const isLink = !!node.href;
			const isStatic = locked && !isLink;
			const staticData = isStatic ? ` data-static="true"` : "";
			const rowClass = isStatic ? "xtyle-tree__row xtyle-tree__row--static" : "xtyle-tree__row";
			const rowOpen = isLink
				? `<a class="xtyle-tree__row" part="row" href="${escapeAttr(node.href as string)}" tabindex="-1" style="--tree-level: ${level}">`
				: `<div class="${rowClass}" part="row"${staticData} style="--tree-level: ${level}">`;
			const rowClose = isLink ? "</a>" : "</div>";
			const trailing = treeTrailing(node, value, isLink);
			const group = hasChildren
				? `<ul class="xtyle-tree__group" role="group"${expanded ? "" : " hidden"}>${buildNodes(node.children as TreeNode[], level + 1, selectedValue)}</ul>`
				: "";
			const expandedAttr = hasChildren ? ` aria-expanded="${String(expanded)}"` : "";
			const disabledAttr = disabled ? ` aria-disabled="true"` : "";
			const lockedAttr = locked ? ` data-locked="true"` : "";
			const itemClass = locked ? "xtyle-tree__item xtyle-tree__item--locked" : "xtyle-tree__item";
			return `<li class="${itemClass}" role="treeitem"${expandedAttr} aria-selected="${String(selected)}"${disabledAttr}${lockedAttr} aria-level="${level}" data-value="${escapeAttr(value)}" tabindex="-1">${rowOpen}${twisty}${label}${trailing}${rowClose}${group}</li>`;
		})
		.join("");
}

/**
 * The single source of a tree's shadow markup. The custom element renders it into
 * its shadow root at runtime; the `@xtyle/astro` binding emits the same string into a
 * declarative shadow root at build. Both paths render one identical control from one
 * source, no per-binding reimplementation. Pure and DOM-free, so it is safe to
 * import in any environment (SSR included).
 */
export function treeMarkup(props: TreeMarkupProps): string {
	const items = props.items ?? [];
	const selectedValue = firstSelectedValue(items);
	const treeLabel = props.labelledby
		? ` aria-labelledby="${props.labelledby}"`
		: props.label
			? ` aria-label="${escapeAttr(props.label)}"`
			: "";
	return `<ul class="${treeClass(props)}" part="tree" role="tree"${treeLabel}>${buildNodes(items, 1, selectedValue)}</ul>`;
}

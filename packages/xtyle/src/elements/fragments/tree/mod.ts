import { escapeSelectorValue } from "../selector-escape.js";

interface OpsBuilder {
	replaceChildren(selector: string, html: string): void;
	setAttr(selector: string, attr: string, value: string): void;
	toggle(selector: string, condition: boolean): void;
}

interface TreeAction {
	id: string;
	label: string;
	icon?: string;
	disabled?: boolean;
}

interface TreeBadge {
	text: string;
	tone?: string;
}

interface TreeNode {
	label: string;
	value?: string;
	href?: string;
	expanded?: boolean;
	locked?: boolean;
	selected?: boolean;
	disabled?: boolean;
	badge?: string | TreeBadge | Array<string | TreeBadge>;
	actions?: TreeAction[];
	children?: TreeNode[];
}

interface TreeBindings {
	items?: TreeNode[];
	size?: string;
	label?: string | null;
	labelledby?: string | null;
	selectedValue?: string | null;
	expandedKeys?: string[];
	rovingValue?: string | null;
}

interface EventPayload {
	dataset?: Record<string, string>;
	tagName?: string;
	key?: string;
	disabled?: boolean;
	ariaDisabled?: string;
}

interface NavRow {
	key: string;
	parent: string | null;
	level: number;
	expandable: boolean;
	expanded: boolean;
	disabled: boolean;
	isLink: boolean;
	locked: boolean;
}

interface NavContext {
	rows: NavRow[];
}

interface Intent {
	select?: string;
	focus?: string;
	expandKey?: string;
	expand?: boolean;
	activate?: string;
	emit?: { type: string; detail?: unknown };
	preventDefault?: boolean;
	stopPropagation?: boolean;
}

declare const hooks: {
	fragment: { [k: string]: (id: string, handler: (bindings: TreeBindings, ops: OpsBuilder) => void) => void };
};
declare const xript: { exports: { register(name: string, fn: (...args: unknown[]) => unknown): void } };

const AMP = /&/g;
const LT = /</g;
const GT = />/g;
const QUOT = /"/g;

function escapeHtml(value: string): string {
	return value.replace(AMP, "&amp;").replace(LT, "&lt;").replace(GT, "&gt;");
}

function escapeAttr(value: string): string {
	return value.replace(AMP, "&amp;").replace(LT, "&lt;").replace(GT, "&gt;").replace(QUOT, "&quot;");
}

function treeClass(bindings: TreeBindings): string {
	const size = bindings.size ?? "md";
	return size === "md" ? "xtyle-tree" : `xtyle-tree xtyle-tree--${size}`;
}

function nodeKey(node: TreeNode): string {
	return node.value ?? node.label;
}

function isExpanded(node: TreeNode, hasChildren: boolean, expanded: Set<string>): boolean {
	const locked = (node.locked ?? false) && hasChildren;
	if (locked) return true;
	return expanded.has(nodeKey(node));
}

/** A locked branch with no route: rendered as a section header, but not interactive — not a link,
 * not selectable, not a keyboard-focus stop. (Locked *with* an href stays a navigable header.) */
function isStaticNode(node: TreeNode): boolean {
	const hasChildren = !!(node.children && node.children.length);
	const locked = (node.locked ?? false) && hasChildren;
	return locked && !node.href;
}

/** The first keyboard-focusable row in pre-order: a static header is skipped for its (always-open)
 * children, so the roving tab stop never lands on a non-interactive header. */
function firstFocusableKey(nodes: TreeNode[]): string | null {
	for (const node of nodes) {
		if (!isStaticNode(node)) return nodeKey(node);
		if (node.children && node.children.length) {
			const child = firstFocusableKey(node.children);
			if (child) return child;
		}
	}
	return null;
}

function rovingTarget(bindings: TreeBindings): string | null {
	if (bindings.rovingValue) return bindings.rovingValue;
	if (bindings.selectedValue) return bindings.selectedValue;
	return firstFocusableKey(bindings.items ?? []);
}

function treeBadges(badge: TreeNode["badge"]): TreeBadge[] {
	if (badge == null) return [];
	const list = Array.isArray(badge) ? badge : [badge];
	return list.map((b) => (typeof b === "string" ? { text: b } : b));
}

function treeTrailing(node: TreeNode, value: string, isLink: boolean): string {
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

function buildNodes(
	nodes: TreeNode[],
	level: number,
	selectedValue: string | null,
	expanded: Set<string>,
	roving: string | null,
): string {
	return nodes
		.map((node) => {
			const hasChildren = !!(node.children && node.children.length);
			const value = nodeKey(node);
			const locked = (node.locked ?? false) && hasChildren;
			const open = isExpanded(node, hasChildren, expanded);
			const selected = value === selectedValue;
			const disabled = node.disabled ?? false;
			const disabledData = disabled ? ` data-disabled="true"` : "";
			const twisty =
				hasChildren && !locked
					? `<span class="xtyle-tree__twisty" aria-hidden="true" data-value="${escapeAttr(value)}"${disabledData}><svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 6l6 6-6 6" /></svg></span>`
					: `<span class="xtyle-tree__twisty xtyle-tree__twisty--leaf" aria-hidden="true"></span>`;
			const label = `<span class="xtyle-tree__label">${escapeHtml(node.label)}</span>`;
			const isLink = !!node.href;
			const isStatic = locked && !isLink;
			const staticData = isStatic ? ` data-static="true"` : "";
			const rowClass = isStatic ? "xtyle-tree__row xtyle-tree__row--static" : "xtyle-tree__row";
			const rowOpen = isLink
				? `<a class="xtyle-tree__row" part="row" href="${escapeAttr(node.href as string)}" tabindex="-1" data-value="${escapeAttr(value)}"${disabledData} style="--tree-level: ${level}">`
				: `<div class="${rowClass}" part="row" data-value="${escapeAttr(value)}"${disabledData}${staticData} style="--tree-level: ${level}">`;
			const rowClose = isLink ? "</a>" : "</div>";
			const trailing = treeTrailing(node, value, isLink);
			const group = hasChildren
				? `<ul class="xtyle-tree__group" role="group"${open ? "" : " hidden"}>${buildNodes(node.children as TreeNode[], level + 1, selectedValue, expanded, roving)}</ul>`
				: "";
			const expandedAttr = hasChildren ? ` aria-expanded="${String(open)}"` : "";
			const disabledAttr = disabled ? ` aria-disabled="true"` : "";
			const lockedAttr = locked ? ` data-locked="true"` : "";
			const itemClass = locked ? "xtyle-tree__item xtyle-tree__item--locked" : "xtyle-tree__item";
			const tabindex = !isStatic && value === roving ? "0" : "-1";
			return `<li class="${itemClass}" role="treeitem"${expandedAttr} aria-selected="${String(selected)}"${disabledAttr}${lockedAttr} aria-level="${level}" data-value="${escapeAttr(value)}" tabindex="${tabindex}">${rowOpen}${twisty}${label}${trailing}${rowClose}${group}</li>`;
		})
		.join("");
}

function tree(bindings: TreeBindings): string {
	const items = bindings.items ?? [];
	const expanded = new Set(bindings.expandedKeys ?? []);
	const selected = bindings.selectedValue ?? null;
	const roving = rovingTarget(bindings);
	return buildNodes(items, 1, selected, expanded, roving);
}

hooks.fragment.mount("tree", (bindings, ops) => {
	ops.setAttr(".xtyle-tree", "class", treeClass(bindings));
	if (bindings.labelledby) ops.setAttr("[data-root]", "aria-labelledby", bindings.labelledby);
	else if (bindings.label) ops.setAttr("[data-root]", "aria-label", bindings.label);
	ops.replaceChildren("[data-root]", tree(bindings));
});

hooks.fragment.update("tree", (bindings, ops) => {
	ops.setAttr(".xtyle-tree", "class", treeClass(bindings));
	const expanded = new Set(bindings.expandedKeys ?? []);
	const selected = bindings.selectedValue ?? null;
	const roving = rovingTarget(bindings);
	const walk = (nodes: TreeNode[]): void => {
		for (const node of nodes) {
			const hasChildren = !!(node.children && node.children.length);
			const value = nodeKey(node);
			const sel = `[role="treeitem"][data-value="${escapeSelectorValue(value)}"]`;
			ops.setAttr(sel, "aria-selected", String(value === selected));
			ops.setAttr(sel, "tabindex", value === roving ? "0" : "-1");
			if (hasChildren) {
				const open = isExpanded(node, hasChildren, expanded);
				const locked = (node.locked ?? false) && hasChildren;
				if (!locked) ops.setAttr(sel, "aria-expanded", String(open));
				ops.toggle(`${sel} > .xtyle-tree__group`, open);
				walk(node.children as TreeNode[]);
			}
		}
	};
	walk(bindings.items ?? []);
});

xript.exports.register("selectRow", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	if (e.dataset?.disabled === "true" || e.dataset?.static === "true") return {};
	const key = e.dataset?.value;
	if (!key) return {};
	const isLink = e.tagName === "A";
	if (isLink) return { select: key, focus: key };
	return { select: key, focus: key, expandKey: key };
});

xript.exports.register("rowAction", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	if (e.dataset?.disabled === "true") return { stopPropagation: true, preventDefault: true };
	const action = e.dataset?.action;
	const value = e.dataset?.value;
	if (!action || value === undefined) return { stopPropagation: true };
	// stopPropagation so the row's own selectRow (a bubbling sibling handler) doesn't fire too.
	return { emit: { type: "tree-action", detail: { value, action } }, stopPropagation: true, preventDefault: true };
});

xript.exports.register("toggleTwisty", (payload: unknown): Intent => {
	const e = payload as EventPayload;
	if (e.dataset?.disabled === "true") return {};
	const key = e.dataset?.value;
	if (!key) return {};
	return { focus: key, expandKey: key, preventDefault: true, stopPropagation: true };
});

xript.exports.register("navKeydown", (payload: unknown, context: unknown): Intent => {
	const e = payload as EventPayload;
	const ctx = context as NavContext;
	const k = e.key ?? "";
	const current = e.dataset?.value ?? "";
	const rows = ctx.rows ?? [];
	const here = rows.findIndex((r) => r.key === current);
	const row = here >= 0 ? rows[here] : undefined;
	if (!row) return {};
	// A locked branch with no route is a section header, skipped by roving focus.
	const isStatic = (r: NavRow): boolean => r.locked && !r.isLink;
	const step = (from: number, dir: number): NavRow | undefined => {
		for (let i = from + dir; i >= 0 && i < rows.length; i += dir) {
			if (!isStatic(rows[i])) return rows[i];
		}
		return undefined;
	};
	switch (k) {
		case "ArrowDown": {
			const next = step(here, 1);
			return next
				? { focus: next.key, preventDefault: true, stopPropagation: true }
				: { preventDefault: true, stopPropagation: true };
		}
		case "ArrowUp": {
			const prev = step(here, -1);
			return prev
				? { focus: prev.key, preventDefault: true, stopPropagation: true }
				: { preventDefault: true, stopPropagation: true };
		}
		case "ArrowRight": {
			if (row.expandable && !row.expanded)
				return { expandKey: row.key, expand: true, focus: row.key, preventDefault: true, stopPropagation: true };
			if (row.expandable && row.expanded) {
				const child = rows.find((r) => r.parent === row.key && !isStatic(r));
				return child
					? { focus: child.key, preventDefault: true, stopPropagation: true }
					: { preventDefault: true, stopPropagation: true };
			}
			return { preventDefault: true, stopPropagation: true };
		}
		case "ArrowLeft": {
			if (row.expandable && row.expanded && !row.locked)
				return { expandKey: row.key, expand: false, focus: row.key, preventDefault: true, stopPropagation: true };
			if (row.parent !== null) {
				const parent = rows.find((r) => r.key === row.parent);
				// Skip a static-header parent — hop to the nearest focusable row above it instead.
				if (parent && !isStatic(parent)) return { focus: row.parent, preventDefault: true, stopPropagation: true };
				const parentIdx = rows.findIndex((r) => r.key === row.parent);
				const above = parentIdx >= 0 ? step(parentIdx, -1) : undefined;
				if (above) return { focus: above.key, preventDefault: true, stopPropagation: true };
			}
			return { preventDefault: true, stopPropagation: true };
		}
		case "Home": {
			const first = rows.find((r) => !isStatic(r));
			return first
				? { focus: first.key, preventDefault: true, stopPropagation: true }
				: { preventDefault: true, stopPropagation: true };
		}
		case "End": {
			const last = step(rows.length, -1);
			return last
				? { focus: last.key, preventDefault: true, stopPropagation: true }
				: { preventDefault: true, stopPropagation: true };
		}
		case "Enter":
		case " ":
		case "Spacebar": {
			if (row.disabled || isStatic(row)) return { preventDefault: true, stopPropagation: true };
			if (row.isLink) return { select: row.key, activate: row.key, preventDefault: true, stopPropagation: true };
			if (row.expandable) return { select: row.key, expandKey: row.key, preventDefault: true, stopPropagation: true };
			return { select: row.key, preventDefault: true, stopPropagation: true };
		}
		default:
			return { stopPropagation: true };
	}
});

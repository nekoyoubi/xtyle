"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/selector-escape.ts
  var BACKSLASH = /\\/g;
  var DQUOTE = /"/g;
  var NEWLINE = /\n/g;
  var CR = /\r/g;
  function escapeSelectorValue(value) {
    return value.replace(BACKSLASH, "\\\\").replace(DQUOTE, '\\"').replace(NEWLINE, "\\A ").replace(CR, "\\D ");
  }

  // packages/xtyle/src/elements/fragments/tree/mod.ts
  var AMP = /&/g;
  var LT = /</g;
  var GT = />/g;
  var QUOT = /"/g;
  function escapeHtml(value) {
    return value.replace(AMP, "&amp;").replace(LT, "&lt;").replace(GT, "&gt;");
  }
  function escapeAttr(value) {
    return value.replace(AMP, "&amp;").replace(LT, "&lt;").replace(GT, "&gt;").replace(QUOT, "&quot;");
  }
  function treeClass(bindings) {
    const size = bindings.size ?? "md";
    return size === "md" ? "xtyle-tree" : `xtyle-tree xtyle-tree--${size}`;
  }
  function nodeKey(node) {
    return node.value ?? node.label;
  }
  function isExpanded(node, hasChildren, expanded) {
    const locked = (node.locked ?? false) && hasChildren;
    if (locked) return true;
    return expanded.has(nodeKey(node));
  }
  function isStaticNode(node) {
    const hasChildren = !!(node.children && node.children.length);
    const locked = (node.locked ?? false) && hasChildren;
    return locked && !node.href;
  }
  function firstFocusableKey(nodes) {
    for (const node of nodes) {
      if (!isStaticNode(node)) return nodeKey(node);
      if (node.children && node.children.length) {
        const child = firstFocusableKey(node.children);
        if (child) return child;
      }
    }
    return null;
  }
  function rovingTarget(bindings) {
    if (bindings.rovingValue) return bindings.rovingValue;
    if (bindings.selectedValue) return bindings.selectedValue;
    return firstFocusableKey(bindings.items ?? []);
  }
  function treeTrailing(node, value, isLink) {
    const badge = node.badge ? `<span class="xtyle-tree__badge" part="badge" aria-hidden="true">${escapeHtml(node.badge)}</span>` : "";
    const actionItems = !isLink && node.actions ? node.actions : [];
    const actions = actionItems.length ? `<span class="xtyle-tree__actions" part="actions">${actionItems.map(
      (a) => `<button type="button" class="xtyle-tree__action" part="row-action" data-action="${escapeAttr(a.id)}" data-value="${escapeAttr(value)}" aria-label="${escapeAttr(a.label)}" title="${escapeAttr(a.label)}" tabindex="-1">${escapeHtml(a.icon ?? a.label)}</button>`
    ).join("")}</span>` : "";
    return badge || actions ? `<span class="xtyle-tree__trailing">${badge}${actions}</span>` : "";
  }
  function buildNodes(nodes, level, selectedValue, expanded, roving) {
    return nodes.map((node) => {
      const hasChildren = !!(node.children && node.children.length);
      const value = nodeKey(node);
      const locked = (node.locked ?? false) && hasChildren;
      const open = isExpanded(node, hasChildren, expanded);
      const selected = value === selectedValue;
      const disabled = node.disabled ?? false;
      const disabledData = disabled ? ` data-disabled="true"` : "";
      const twisty = hasChildren && !locked ? `<span class="xtyle-tree__twisty" aria-hidden="true" data-value="${escapeAttr(value)}"${disabledData}><svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 6l6 6-6 6" /></svg></span>` : `<span class="xtyle-tree__twisty xtyle-tree__twisty--leaf" aria-hidden="true"></span>`;
      const label = `<span class="xtyle-tree__label">${escapeHtml(node.label)}</span>`;
      const isLink = !!node.href;
      const isStatic = locked && !isLink;
      const staticData = isStatic ? ` data-static="true"` : "";
      const rowClass = isStatic ? "xtyle-tree__row xtyle-tree__row--static" : "xtyle-tree__row";
      const rowOpen = isLink ? `<a class="xtyle-tree__row" part="row" href="${escapeAttr(node.href)}" tabindex="-1" data-value="${escapeAttr(value)}"${disabledData} style="--tree-level: ${level}">` : `<div class="${rowClass}" part="row" data-value="${escapeAttr(value)}"${disabledData}${staticData} style="--tree-level: ${level}">`;
      const rowClose = isLink ? "</a>" : "</div>";
      const trailing = treeTrailing(node, value, isLink);
      const group = hasChildren ? `<ul class="xtyle-tree__group" role="group"${open ? "" : " hidden"}>${buildNodes(node.children, level + 1, selectedValue, expanded, roving)}</ul>` : "";
      const expandedAttr = hasChildren ? ` aria-expanded="${String(open)}"` : "";
      const disabledAttr = disabled ? ` aria-disabled="true"` : "";
      const lockedAttr = locked ? ` data-locked="true"` : "";
      const itemClass = locked ? "xtyle-tree__item xtyle-tree__item--locked" : "xtyle-tree__item";
      const tabindex = !isStatic && value === roving ? "0" : "-1";
      return `<li class="${itemClass}" role="treeitem"${expandedAttr} aria-selected="${String(selected)}"${disabledAttr}${lockedAttr} aria-level="${level}" data-value="${escapeAttr(value)}" tabindex="${tabindex}">${rowOpen}${twisty}${label}${trailing}${rowClose}${group}</li>`;
    }).join("");
  }
  function tree(bindings) {
    const items = bindings.items ?? [];
    const expanded = new Set(bindings.expandedKeys ?? []);
    const selected = bindings.selectedValue ?? null;
    const roving = rovingTarget(bindings);
    return buildNodes(items, 1, selected, expanded, roving);
  }
  hooks.fragment.mount("tree", (bindings, ops) => {
    ops.setAttr("[data-root]", "class", treeClass(bindings));
    if (bindings.labelledby) ops.setAttr("[data-root]", "aria-labelledby", bindings.labelledby);
    else if (bindings.label) ops.setAttr("[data-root]", "aria-label", bindings.label);
    ops.replaceChildren("[data-root]", tree(bindings));
  });
  hooks.fragment.update("tree", (bindings, ops) => {
    ops.setAttr("[data-root]", "class", treeClass(bindings));
    const expanded = new Set(bindings.expandedKeys ?? []);
    const selected = bindings.selectedValue ?? null;
    const roving = rovingTarget(bindings);
    const walk = (nodes) => {
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
          walk(node.children);
        }
      }
    };
    walk(bindings.items ?? []);
  });
  xript.exports.register("selectRow", (payload) => {
    const e = payload;
    if (e.dataset?.disabled === "true" || e.dataset?.static === "true") return {};
    const key = e.dataset?.value;
    if (!key) return {};
    const isLink = e.tagName === "A";
    if (isLink) return { select: key, focus: key };
    return { select: key, focus: key, expandKey: key };
  });
  xript.exports.register("rowAction", (payload) => {
    const e = payload;
    const action = e.dataset?.action;
    const value = e.dataset?.value;
    if (!action || value === void 0) return { stopPropagation: true };
    return { emit: { type: "tree-action", detail: { value, action } }, stopPropagation: true, preventDefault: true };
  });
  xript.exports.register("toggleTwisty", (payload) => {
    const e = payload;
    if (e.dataset?.disabled === "true") return {};
    const key = e.dataset?.value;
    if (!key) return {};
    return { focus: key, expandKey: key, preventDefault: true, stopPropagation: true };
  });
  xript.exports.register("navKeydown", (payload, context) => {
    const e = payload;
    const ctx = context;
    const k = e.key ?? "";
    const current = e.dataset?.value ?? "";
    const rows = ctx.rows ?? [];
    const here = rows.findIndex((r) => r.key === current);
    const row = here >= 0 ? rows[here] : void 0;
    if (!row) return {};
    const isStatic = (r) => r.locked && !r.isLink;
    const step = (from, dir) => {
      for (let i = from + dir; i >= 0 && i < rows.length; i += dir) {
        if (!isStatic(rows[i])) return rows[i];
      }
      return void 0;
    };
    switch (k) {
      case "ArrowDown": {
        const next = step(here, 1);
        return next ? { focus: next.key, preventDefault: true, stopPropagation: true } : { preventDefault: true, stopPropagation: true };
      }
      case "ArrowUp": {
        const prev = step(here, -1);
        return prev ? { focus: prev.key, preventDefault: true, stopPropagation: true } : { preventDefault: true, stopPropagation: true };
      }
      case "ArrowRight": {
        if (row.expandable && !row.expanded)
          return { expandKey: row.key, expand: true, focus: row.key, preventDefault: true, stopPropagation: true };
        if (row.expandable && row.expanded) {
          const child = rows.find((r) => r.parent === row.key && !isStatic(r));
          return child ? { focus: child.key, preventDefault: true, stopPropagation: true } : { preventDefault: true, stopPropagation: true };
        }
        return { preventDefault: true, stopPropagation: true };
      }
      case "ArrowLeft": {
        if (row.expandable && row.expanded && !row.locked)
          return { expandKey: row.key, expand: false, focus: row.key, preventDefault: true, stopPropagation: true };
        if (row.parent !== null) {
          const parent = rows.find((r) => r.key === row.parent);
          if (parent && !isStatic(parent)) return { focus: row.parent, preventDefault: true, stopPropagation: true };
          const parentIdx = rows.findIndex((r) => r.key === row.parent);
          const above = parentIdx >= 0 ? step(parentIdx, -1) : void 0;
          if (above) return { focus: above.key, preventDefault: true, stopPropagation: true };
        }
        return { preventDefault: true, stopPropagation: true };
      }
      case "Home": {
        const first = rows.find((r) => !isStatic(r));
        return first ? { focus: first.key, preventDefault: true, stopPropagation: true } : { preventDefault: true, stopPropagation: true };
      }
      case "End": {
        const last = step(rows.length, -1);
        return last ? { focus: last.key, preventDefault: true, stopPropagation: true } : { preventDefault: true, stopPropagation: true };
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
})();

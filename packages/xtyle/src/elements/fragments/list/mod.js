"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/escape.ts
  var AMP = /&/g;
  var LT = /</g;
  var GT = />/g;
  var DQUOTE = /"/g;
  var SQUOTE = /'/g;
  function escapeHtml(value) {
    return value.replace(AMP, "&amp;").replace(LT, "&lt;").replace(GT, "&gt;");
  }
  function escapeAttr(value) {
    return escapeHtml(value).replace(DQUOTE, "&quot;").replace(SQUOTE, "&#39;");
  }

  // packages/xtyle/src/elements/fragments/selector-escape.ts
  var BACKSLASH = /\\/g;
  var DQUOTE2 = /"/g;
  var NEWLINE = /\n/g;
  var CR = /\r/g;
  function escapeSelectorValue(value) {
    return value.replace(BACKSLASH, "\\\\").replace(DQUOTE2, '\\"').replace(NEWLINE, "\\A ").replace(CR, "\\D ");
  }

  // packages/xtyle/src/elements/collection/roving.ts
  function focusableAt(items2, index) {
    const item = items2[index];
    return item && !item.skip ? item.key : null;
  }
  function firstKey(items2) {
    for (let i = 0; i < items2.length; i++) {
      const key = focusableAt(items2, i);
      if (key !== null) return key;
    }
    return null;
  }
  function lastKey(items2) {
    for (let i = items2.length - 1; i >= 0; i--) {
      const key = focusableAt(items2, i);
      if (key !== null) return key;
    }
    return null;
  }
  function stepKey(items2, fromKey, dir, wrap = false) {
    const n = items2.length;
    if (n === 0) return null;
    const found = fromKey === null ? -1 : items2.findIndex((it) => it.key === fromKey);
    const here = found === -1 ? dir > 0 ? -1 : n : found;
    for (let s = 1; s <= n; s++) {
      let idx = here + dir * s;
      if (wrap) idx = (idx % n + n) % n;
      else if (idx < 0 || idx >= n) return null;
      const key = focusableAt(items2, idx);
      if (key !== null) return key;
      if (wrap && idx === here) break;
    }
    return null;
  }

  // packages/xtyle/src/elements/collection/nav-reducer.ts
  function axisKeys(orientation) {
    switch (orientation) {
      case "horizontal":
        return { next: ["ArrowRight"], prev: ["ArrowLeft"] };
      case "both":
        return { next: ["ArrowDown", "ArrowRight"], prev: ["ArrowUp", "ArrowLeft"] };
      default:
        return { next: ["ArrowDown"], prev: ["ArrowUp"] };
    }
  }
  function linearNav(items2, currentKey, key, opts = {}) {
    const orientation = opts.orientation ?? "vertical";
    const wrap = opts.wrap ?? false;
    const { next, prev } = axisKeys(orientation);
    if (next.includes(key)) {
      const target = stepKey(items2, currentKey, 1, wrap);
      return target !== null ? { focus: target, handled: true } : { handled: true };
    }
    if (prev.includes(key)) {
      const target = stepKey(items2, currentKey, -1, wrap);
      return target !== null ? { focus: target, handled: true } : { handled: true };
    }
    if (opts.homeEnd && key === "Home") {
      const target = firstKey(items2);
      return target !== null ? { focus: target, handled: true } : { handled: true };
    }
    if (opts.homeEnd && key === "End") {
      const target = lastKey(items2);
      return target !== null ? { focus: target, handled: true } : { handled: true };
    }
    if (key === "Enter" || key === " " || key === "Spacebar") {
      return { activate: true, handled: true };
    }
    return {};
  }

  // packages/xtyle/src/elements/fragments/list/mod.ts
  function isSelectable(bindings) {
    return bindings.interaction === "selectable" && (bindings.selection ?? "none") !== "none";
  }
  function isRoving(bindings) {
    return (bindings.interaction ?? "navigational") !== "static";
  }
  function rootClass(bindings) {
    const size = bindings.size ?? "md";
    const orientation = bindings.orientation ?? "vertical";
    return [
      "xtyle-list",
      `xtyle-list--${orientation}`,
      size !== "md" && `xtyle-list--${size}`,
      `xtyle-list--${bindings.interaction ?? "navigational"}`
    ].filter(Boolean).join(" ");
  }
  function itemBody(item, bindings) {
    const lead = item.lead ? `<span class="xtyle-list__lead" part="lead"><xtyle-icon name="${escapeAttr(item.lead)}"></xtyle-icon></span>` : "";
    const label = `<span class="xtyle-list__label" part="label">${escapeHtml(item.label)}</span>`;
    const trail = item.trail ? `<span class="xtyle-list__trail" part="trail">${escapeHtml(item.trail)}</span>` : "";
    const actionable = bindings.interaction === "actionable";
    const actions = actionable && item.actions && item.actions.length ? `<span class="xtyle-list__actions" part="actions">${item.actions.map((a) => {
      const disabled = a.disabled ? ' disabled data-disabled="true"' : "";
      return `<button type="button" class="xtyle-list__action" part="item-action" data-action="${escapeAttr(a.id)}" data-value="${escapeAttr(item.value)}" aria-label="${escapeAttr(a.label)}" title="${escapeAttr(a.label)}" tabindex="-1"${disabled}>${escapeHtml(a.icon ?? a.label)}</button>`;
    }).join("")}</span>` : "";
    return `${lead}${label}${trail}${actions}`;
  }
  function items(bindings) {
    const list = bindings.items ?? [];
    const selectable = isSelectable(bindings);
    const roving = isRoving(bindings);
    const selected = new Set(bindings.selectedKeys ?? []);
    const rovingValue = bindings.rovingValue ?? null;
    const role = selectable ? "option" : "listitem";
    return list.map((item) => {
      const disabled = item.disabled ?? false;
      const disabledAttr = disabled ? ' aria-disabled="true" data-disabled="true"' : "";
      const selAttr = selectable ? ` aria-selected="${String(selected.has(item.value))}"` : "";
      const tabindex = roving ? !disabled && item.value === rovingValue ? "0" : "-1" : "";
      const tabAttr = roving ? ` tabindex="${tabindex}"` : "";
      return `<li class="xtyle-list__item" part="item" role="${role}" data-value="${escapeAttr(item.value)}"${selAttr}${disabledAttr}${tabAttr}>${itemBody(item, bindings)}</li>`;
    }).join("");
  }
  function listInner(bindings) {
    const selectable = isSelectable(bindings);
    const listRole = selectable ? "listbox" : "list";
    const multi = selectable && (bindings.selection === "multi" || bindings.selection === "range");
    const multiAttr = multi ? ' aria-multiselectable="true"' : "";
    const labelledby = bindings.labelledby ?? null;
    const labelText = bindings.label ?? null;
    const ariaLabel = bindings.ariaLabel ?? null;
    const labelId = `${bindings.elementId ?? "xtyle-list"}-label`;
    const orientation = bindings.orientation === "horizontal" ? ' aria-orientation="horizontal"' : "";
    const name = labelledby ? ` aria-labelledby="${escapeAttr(labelledby)}"` : labelText ? ` aria-labelledby="${escapeAttr(labelId)}"` : ariaLabel ? ` aria-label="${escapeAttr(ariaLabel)}"` : "";
    const heading = labelText ? `<span class="xtyle-list__title" part="title" id="${escapeAttr(labelId)}">${escapeHtml(labelText)}</span>` : "";
    return `${heading}<ul class="${rootClass(bindings)}" part="list" role="${listRole}"${name}${multiAttr}${orientation}>${items(bindings)}</ul>`;
  }
  hooks.fragment.mount("list", (bindings, ops) => {
    ops.replaceChildren("[data-root]", listInner(bindings));
  });
  hooks.fragment.update("list", (bindings, ops) => {
    const selectable = isSelectable(bindings);
    const roving = isRoving(bindings);
    const selected = new Set(bindings.selectedKeys ?? []);
    const rovingValue = bindings.rovingValue ?? null;
    ops.setAttr('[role="listbox"], [role="list"]', "class", rootClass(bindings));
    for (const item of bindings.items ?? []) {
      const sel = `[data-value="${escapeSelectorValue(item.value)}"]`;
      if (selectable) ops.setAttr(sel, "aria-selected", String(selected.has(item.value)));
      if (roving) ops.setAttr(sel, "tabindex", !item.disabled && item.value === rovingValue ? "0" : "-1");
    }
  });
  function selectMode(e) {
    if (e.shiftKey) return "range";
    if (e.ctrlKey || e.metaKey) return "toggle";
    return "replace";
  }
  xript.exports.register("selectItem", (payload, context) => {
    const e = payload;
    const ctx = context;
    if (e.disabled || e.ariaDisabled === "true") return {};
    const value = e.dataset?.value;
    if (!value) return {};
    if (ctx.interaction === "selectable" && ctx.selection !== "none") {
      return { select: value, selectMode: selectMode(e), focus: value };
    }
    if (ctx.interaction === "static") return {};
    return { activate: value, focus: value };
  });
  xript.exports.register("itemAction", (payload) => {
    const e = payload;
    if (e.dataset?.disabled === "true") return { stopPropagation: true, preventDefault: true };
    const action = e.dataset?.action;
    const value = e.dataset?.value;
    if (!action || value === void 0) return { stopPropagation: true };
    return { emit: { type: "list-action", detail: { value, action } }, stopPropagation: true, preventDefault: true };
  });
  xript.exports.register("navKeydown", (payload, context) => {
    const e = payload;
    const ctx = context;
    if (e.disabled || e.ariaDisabled === "true") return {};
    const current = e.dataset?.value ?? "";
    const orientation = ctx.orientation === "horizontal" ? "horizontal" : "vertical";
    const move = linearNav(ctx.navItems, current, e.key ?? "", { orientation, homeEnd: true });
    if (move.focus !== void 0) return { focus: move.focus, preventDefault: true, stopPropagation: true };
    if (move.activate) {
      if (ctx.interaction === "selectable" && ctx.selection !== "none") {
        const mode = ctx.selection === "single" ? "replace" : "toggle";
        return { select: current, selectMode: mode, preventDefault: true };
      }
      if (ctx.interaction === "static") return { preventDefault: true };
      return { activate: current, preventDefault: true };
    }
    if (move.handled) return { preventDefault: true, stopPropagation: true };
    return {};
  });
})();

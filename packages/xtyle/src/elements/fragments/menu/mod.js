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

  // packages/xtyle/src/elements/fragments/menu/mod.ts
  function triggerLabel(bindings) {
    return bindings.label ?? "Menu";
  }
  function action(item) {
    const label = item.label ?? "";
    const value = item.value ?? label;
    const disabledAttr = item.disabled ? ` aria-disabled="true"` : "";
    const intentAttr = item.intent === "danger" ? ` data-intent="danger"` : "";
    const hint = item.hint ? `<span class="xtyle-menu__item-hint" part="item-hint" aria-hidden="true">${escapeHtml(item.hint)}</span>` : "";
    return `<button type="button" class="xtyle-menu__item" part="item" role="menuitem" tabindex="-1"${disabledAttr}${intentAttr} data-value="${escapeAttr(value)}" data-label="${escapeAttr(label)}"><span class="xtyle-menu__item-label">${escapeHtml(label)}</span>${hint}</button>`;
  }
  function items(bindings) {
    let out = "";
    let groupOpen = false;
    const closeGroup = () => {
      if (groupOpen) {
        out += "</div>";
        groupOpen = false;
      }
    };
    for (const item of bindings.items ?? []) {
      if (item.heading !== void 0) {
        closeGroup();
        out += `<div class="xtyle-menu__group" role="group" aria-label="${escapeAttr(item.heading)}"><div class="xtyle-menu__heading" aria-hidden="true">${escapeHtml(item.heading)}</div>`;
        groupOpen = true;
        continue;
      }
      if (item.separator) {
        out += `<div class="xtyle-menu__separator" role="separator"></div>`;
        continue;
      }
      out += action(item);
    }
    closeGroup();
    return out;
  }
  hooks.fragment.mount("menu", (bindings, ops) => {
    const label = triggerLabel(bindings);
    const popupId = bindings.popupId ?? "xtyle-menu-popup";
    const open = bindings.open ?? false;
    const context = bindings.context ?? false;
    ops.setAttr("[data-root]", "data-context", context ? "true" : "");
    ops.setAttr("[data-trigger]", "hidden", context ? "hidden" : "");
    ops.setAttr("[data-trigger]", "aria-controls", popupId);
    ops.setAttr("[data-trigger]", "popovertarget", popupId);
    ops.setAttr("[data-trigger]", "aria-expanded", String(open));
    ops.setText("[data-trigger]", label);
    ops.setAttr("[data-popup]", "id", popupId);
    ops.setAttr("[data-popup]", "aria-label", label);
    ops.replaceChildren("[data-items]", items(bindings));
  });
  hooks.fragment.update("menu", (bindings, ops) => {
    ops.setAttr("[data-trigger]", "aria-expanded", String(bindings.open ?? false));
  });
  xript.exports.register("triggerKeydown", (payload) => {
    const e = payload;
    switch (e.key) {
      case "Enter":
      case " ":
      case "Spacebar":
      case "ArrowDown":
        return { openMenu: "first", preventDefault: true };
      case "ArrowUp":
        return { openMenu: "last", preventDefault: true };
      default:
        return {};
    }
  });
  xript.exports.register("itemClick", (payload, context) => {
    const e = payload;
    if (e.disabled || e.ariaDisabled === "true") return {};
    const value = e.dataset?.value;
    if (value === void 0) return {};
    const ctx = context;
    const index = (ctx?.enabledValues ?? []).indexOf(value);
    return { activateValue: value, activateLabel: e.dataset?.label, activateIndex: index };
  });
  xript.exports.register("itemKeydown", (payload, context) => {
    const e = payload;
    const ctx = context;
    const enabled = ctx?.enabledValues ?? [];
    const current = e.dataset?.value ?? "";
    const k = e.key ?? "";
    switch (k) {
      case "Enter":
      case " ":
      case "Spacebar": {
        if (e.disabled || e.ariaDisabled === "true") return { preventDefault: true };
        const value = e.dataset?.value;
        if (value === void 0) return { preventDefault: true };
        return {
          activateValue: value,
          activateLabel: e.dataset?.label,
          activateIndex: enabled.indexOf(value),
          preventDefault: true
        };
      }
      case "Escape":
        return { closeMenu: true, returnFocus: true, preventDefault: true, stopPropagation: true };
      case "Tab":
        return { closeMenu: true, returnFocus: false };
    }
    const navItems = enabled.map((value) => ({ key: value }));
    const move = linearNav(navItems, current, k, { orientation: "vertical", wrap: true, homeEnd: true });
    if (move.focus !== void 0) return { focusValue: move.focus, preventDefault: true };
    return {};
  });
})();

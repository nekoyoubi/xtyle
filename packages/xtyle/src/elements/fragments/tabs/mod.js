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
  function focusableAt(items, index) {
    const item = items[index];
    return item && !item.skip ? item.key : null;
  }
  function firstKey(items) {
    for (let i = 0; i < items.length; i++) {
      const key = focusableAt(items, i);
      if (key !== null) return key;
    }
    return null;
  }
  function lastKey(items) {
    for (let i = items.length - 1; i >= 0; i--) {
      const key = focusableAt(items, i);
      if (key !== null) return key;
    }
    return null;
  }
  function stepKey(items, fromKey, dir, wrap = false) {
    const n = items.length;
    if (n === 0) return null;
    const found = fromKey === null ? -1 : items.findIndex((it) => it.key === fromKey);
    const here = found === -1 ? dir > 0 ? -1 : n : found;
    for (let s = 1; s <= n; s++) {
      let idx = here + dir * s;
      if (wrap) idx = (idx % n + n) % n;
      else if (idx < 0 || idx >= n) return null;
      const key = focusableAt(items, idx);
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
  function linearNav(items, currentKey, key, opts = {}) {
    const orientation = opts.orientation ?? "vertical";
    const wrap = opts.wrap ?? false;
    const { next, prev } = axisKeys(orientation);
    if (next.includes(key)) {
      const target = stepKey(items, currentKey, 1, wrap);
      return target !== null ? { focus: target, handled: true } : { handled: true };
    }
    if (prev.includes(key)) {
      const target = stepKey(items, currentKey, -1, wrap);
      return target !== null ? { focus: target, handled: true } : { handled: true };
    }
    if (opts.homeEnd && key === "Home") {
      const target = firstKey(items);
      return target !== null ? { focus: target, handled: true } : { handled: true };
    }
    if (opts.homeEnd && key === "End") {
      const target = lastKey(items);
      return target !== null ? { focus: target, handled: true } : { handled: true };
    }
    if (key === "Enter" || key === " " || key === "Spacebar") {
      return { activate: true, handled: true };
    }
    return {};
  }

  // packages/xtyle/src/elements/fragments/tabs/mod.ts
  function selectedKey(bindings) {
    const tabs = bindings.tabs ?? [];
    const keys = tabs.map((t, i) => t.key ?? String(i));
    const requested = bindings.activeId ?? null;
    if (requested !== null) {
      const idx = keys.indexOf(requested);
      if (idx !== -1 && !tabs[idx]?.disabled) return requested;
    }
    const firstEnabled = tabs.findIndex((t) => !t.disabled);
    return keys[firstEnabled] ?? null;
  }
  function rootClass(bindings) {
    const variant = bindings.variant ?? "underline";
    const size = bindings.size ?? "md";
    const parts = ["xtyle-tabs", `xtyle-tabs--${variant}`];
    if (size !== "md") parts.push(`xtyle-tabs--${size}`);
    if (bindings.sticky) parts.push("xtyle-tabs--sticky");
    return parts.join(" ");
  }
  function tabButtons(bindings, selected) {
    const tabs = bindings.tabs ?? [];
    const uid = bindings.uid ?? "xtyle-tabs";
    return tabs.map((tab, i) => {
      const key = tab.key ?? String(i);
      const isSelected = key === selected;
      const tabindex = isSelected && !tab.disabled ? "0" : "-1";
      const disabledAttr = tab.disabled ? ' disabled aria-disabled="true"' : "";
      const controls = bindings.tablist ? "" : ` aria-controls="${escapeAttr(uid)}-panel-${i}"`;
      return `<button class="xtyle-tabs__tab" part="tab" type="button" role="tab" id="${escapeAttr(uid)}-tab-${i}" data-key="${escapeAttr(key)}" aria-selected="${String(isSelected)}"${controls} tabindex="${tabindex}"${disabledAttr}>${escapeHtml(tab.label)}</button>`;
    }).join("");
  }
  function panels(bindings, selected) {
    const tabs = bindings.tabs ?? [];
    const uid = bindings.uid ?? "xtyle-tabs";
    return tabs.map((tab, i) => {
      const key = tab.key ?? String(i);
      const isSelected = key === selected;
      const hidden = isSelected ? "" : " hidden";
      const body = tab.panelSlot ? `<slot name="${escapeAttr(tab.panelSlot)}"></slot>` : tab.panel ?? "";
      return `<div class="xtyle-tabs__panel" part="panel" role="tabpanel" id="${escapeAttr(uid)}-panel-${i}" data-key="${escapeAttr(key)}" aria-labelledby="${escapeAttr(uid)}-tab-${i}" tabindex="0"${hidden}>${body}</div>`;
    }).join("");
  }
  hooks.fragment.mount("tabs", (bindings, ops) => {
    const selected = selectedKey(bindings);
    ops.setAttr(".xtyle-tabs", "class", rootClass(bindings));
    const tablistLabel = bindings.labelledby ?? bindings.label ?? "";
    const tablistAttr = bindings.labelledby ? "aria-labelledby" : "aria-label";
    if (tablistLabel) ops.setAttr("[data-tablist]", tablistAttr, tablistLabel);
    ops.replaceChildren("[data-tablist]", tabButtons(bindings, selected));
    ops.replaceChildren("[data-panels]", bindings.tablist ? "" : panels(bindings, selected));
  });
  hooks.fragment.update("tabs", (bindings, ops) => {
    const selected = selectedKey(bindings);
    ops.setAttr(".xtyle-tabs", "class", rootClass(bindings));
    const tabs = bindings.tabs ?? [];
    tabs.forEach((tab, i) => {
      const key = tab.key ?? String(i);
      const isSelected = key === selected;
      ops.setAttr(`[role="tab"][data-key="${escapeAttr(key)}"]`, "aria-selected", String(isSelected));
      ops.setAttr(`[role="tab"][data-key="${escapeAttr(key)}"]`, "tabindex", isSelected && !tab.disabled ? "0" : "-1");
      ops.toggle(`[role="tabpanel"][data-key="${escapeAttr(key)}"]`, isSelected);
    });
  });
  xript.exports.register("selectTab", (payload) => {
    const e = payload;
    if (e.disabled || e.ariaDisabled === "true") return {};
    const key = e.dataset?.key;
    return key ? { select: key, focus: key } : {};
  });
  xript.exports.register("navKeydown", (payload, context) => {
    const e = payload;
    const ctx = context;
    const current = e.dataset?.key ?? "";
    const navItems = (ctx.enabledKeys ?? []).map((key) => ({ key }));
    const move = linearNav(navItems, current, e.key ?? "", { orientation: "both", wrap: true, homeEnd: true });
    if (move.focus !== void 0) {
      return ctx.activation === "automatic" ? { select: move.focus, focus: move.focus, preventDefault: true } : { focus: move.focus, preventDefault: true };
    }
    if (move.activate && ctx.activation === "manual" && current) {
      return { select: current, focus: current, preventDefault: true };
    }
    return {};
  });
})();

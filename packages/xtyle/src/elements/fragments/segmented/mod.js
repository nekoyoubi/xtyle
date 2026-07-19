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

  // packages/xtyle/src/elements/fragments/segmented/mod.ts
  function selectedValue(bindings) {
    const segments = bindings.segments ?? [];
    const requested = bindings.value ?? null;
    if (requested != null && segments.some((s) => s.value === requested && !s.disabled)) return requested;
    const firstEnabled = segments.find((s) => !s.disabled) ?? segments[0];
    return firstEnabled?.value ?? "";
  }
  function rootClass(bindings) {
    const size = bindings.size ?? "md";
    const tone = bindings.tone ?? "accent";
    return [
      "xtyle-segmented",
      `xtyle-segmented--${tone}`,
      size !== "md" && `xtyle-segmented--${size}`,
      bindings.disabled && "xtyle-segmented--disabled"
    ].filter(Boolean).join(" ");
  }
  function options(bindings, selected) {
    const segments = bindings.segments ?? [];
    const groupDisabled = bindings.disabled ?? false;
    return segments.map((seg) => {
      const segDisabled = groupDisabled || !!seg.disabled;
      const isOn = seg.value === selected;
      const tabindex = segDisabled ? "-1" : isOn ? "0" : "-1";
      const disabledAttr = segDisabled ? " disabled" : "";
      const badge = seg.badge ? `<span class="xtyle-segmented__badge" part="badge">${escapeHtml(seg.badge)}</span>` : "";
      const ariaLabel = seg.slot ? ` aria-label="${escapeAttr(seg.label)}"` : "";
      const tooltip = seg.title ?? (seg.slot ? seg.label : void 0);
      const titleAttr = tooltip ? ` title="${escapeAttr(tooltip)}"` : "";
      const named = `${ariaLabel}${titleAttr}`;
      const body = seg.slot ? `<slot name="${escapeAttr(seg.slot)}"></slot>` : escapeHtml(seg.label);
      const optionClass = seg.slot ? "xtyle-segmented__option xtyle-segmented__option--icon" : "xtyle-segmented__option";
      return `<button class="${optionClass}" part="option" type="button" role="radio" aria-checked="${String(isOn)}" tabindex="${tabindex}" data-value="${escapeAttr(seg.value)}"${named}${disabledAttr}>${body}${badge}</button>`;
    }).join("");
  }
  function fieldInner(bindings, selected) {
    const labelText = bindings.label ?? null;
    const labelledby = bindings.labelledby ?? null;
    const ariaLabel = bindings.ariaLabel ?? null;
    const labelId = `${bindings.elementId ?? "xtyle-segmented"}-label`;
    const groupName = labelledby ? ` aria-labelledby="${escapeAttr(labelledby)}"` : labelText ? ` aria-labelledby="${escapeAttr(labelId)}"` : ariaLabel ? ` aria-label="${escapeAttr(ariaLabel)}"` : "";
    const label = labelText ? `<span class="xtyle-segmented__label" part="label" id="${escapeAttr(labelId)}">${escapeHtml(labelText)}</span>` : "";
    return `${label}<div class="${rootClass(bindings)}" part="segmented" role="radiogroup"${groupName}>${options(bindings, selected)}</div>`;
  }
  hooks.fragment.mount("segmented", (bindings, ops) => {
    const selected = selectedValue(bindings);
    ops.replaceChildren("[data-control]", fieldInner(bindings, selected));
  });
  hooks.fragment.update("segmented", (bindings, ops) => {
    const selected = selectedValue(bindings);
    const groupDisabled = bindings.disabled ?? false;
    ops.setAttr('[role="radiogroup"]', "class", rootClass(bindings));
    for (const seg of bindings.segments ?? []) {
      const segDisabled = groupDisabled || !!seg.disabled;
      const isOn = seg.value === selected;
      const sel = `[role="radio"][data-value="${escapeSelectorValue(seg.value)}"]`;
      ops.setAttr(sel, "aria-checked", String(isOn));
      ops.setAttr(sel, "tabindex", segDisabled ? "-1" : isOn ? "0" : "-1");
    }
  });
  xript.exports.register("selectOption", (payload) => {
    const e = payload;
    if (e.disabled || e.ariaDisabled === "true") return {};
    const value = e.dataset?.value;
    return value ? { select: value, focus: value } : {};
  });
  xript.exports.register("navKeydown", (payload, context) => {
    const e = payload;
    if (e.disabled || e.ariaDisabled === "true") return {};
    const ctx = context;
    const navItems = (ctx.enabledKeys ?? []).map((key) => ({ key }));
    const move = linearNav(navItems, e.dataset?.value ?? "", e.key ?? "", { orientation: "both", wrap: true, homeEnd: true });
    return move.focus !== void 0 ? { select: move.focus, focus: move.focus, preventDefault: true } : {};
  });
})();

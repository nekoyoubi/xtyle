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

  // packages/xtyle/src/elements/fragments/combobox/mod.ts
  var CHECK_GLYPH = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5l3.5 3.5L13 4.5" /></svg>`;
  var REMOVE_GLYPH = `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>`;
  function rootClass(b) {
    const size = b.size ?? "md";
    return [
      "xtyle-combobox",
      b.invalid && "xtyle-combobox--invalid",
      b.disabled && "xtyle-combobox--disabled",
      b.readonly && "xtyle-combobox--readonly",
      b.multiple && "xtyle-combobox--multiple",
      b.open && "xtyle-combobox--open",
      size !== "md" && `xtyle-combobox--${size}`
    ].filter(Boolean).join(" ");
  }
  function describedBy(b) {
    const description = b.description ?? "";
    const error = b.error ?? "";
    return [
      description.length > 0 ? b.descriptionId : null,
      b.invalid && error.length > 0 ? b.errorId : null
    ].filter(Boolean).join(" ");
  }
  function optionsHtml(b) {
    let out = "";
    for (const option of b.options ?? []) {
      const value = option.value ?? "";
      const label = option.label ?? value;
      const selected = option.selected === true;
      const check = `<span class="xtyle-combobox__check" part="check"${selected ? "" : " hidden"} aria-hidden="true">${CHECK_GLYPH}</span>`;
      out += `<li class="xtyle-combobox__option" part="option" role="option" id="${escapeAttr(option.id ?? "")}" data-option data-value="${escapeAttr(value)}" data-label="${escapeAttr(label)}" aria-selected="${selected}" data-active="${option.active === true}"><span class="xtyle-combobox__option-label">${escapeHtml(label)}</span>${check}</li>`;
    }
    return out;
  }
  function chipsHtml(b) {
    let out = "";
    for (const chip of b.chips ?? []) {
      const value = chip.value ?? "";
      const label = chip.label ?? value;
      out += `<span class="xtyle-combobox__chip" part="chip" data-chip data-value="${escapeAttr(value)}"><span class="xtyle-combobox__chip-label">${escapeHtml(label)}</span><button type="button" class="xtyle-combobox__chip-remove" part="chip-remove" tabindex="-1" data-chip-remove data-value="${escapeAttr(value)}" aria-label="Remove ${escapeAttr(label)}">${REMOVE_GLYPH}</button></span>`;
    }
    return out;
  }
  function paint(b, ops) {
    const inputId = b.inputId ?? "xtyle-combobox-input";
    const listId = b.listId ?? "xtyle-combobox-list";
    const label = b.label ?? "";
    const description = b.description ?? "";
    const error = b.error ?? "";
    const open = b.open === true;
    const disabled = b.disabled === true;
    const readonly = b.readonly === true;
    const required = b.required === true;
    const invalid = b.invalid === true;
    const options = b.options ?? [];
    const describes = describedBy(b);
    const star = required ? `<span class="xtyle-combobox__required" part="required" aria-hidden="true">*</span>` : "";
    ops.setAttr(".xtyle-combobox", "class", rootClass(b));
    ops.replaceChildren("[data-label]", `${escapeHtml(label)}${star}`);
    ops.setAttr("[data-label]", "for", inputId);
    ops.setAttr("[data-label]", "hidden", label.length > 0 ? "" : "hidden");
    ops.setAttr("[data-input]", "id", inputId);
    ops.setAttr("[data-input]", "placeholder", b.placeholder ?? "");
    ops.setAttr("[data-input]", "aria-controls", listId);
    ops.setAttr("[data-input]", "aria-expanded", String(open));
    ops.setAttr("[data-input]", "aria-activedescendant", open ? b.activeId ?? "" : "");
    ops.setAttr("[data-input]", "aria-invalid", String(invalid));
    ops.setAttr("[data-input]", "aria-required", required ? "true" : "");
    ops.setAttr("[data-input]", "aria-describedby", describes);
    ops.setAttr("[data-input]", "aria-label", label.length === 0 ? b.ariaLabel ?? b.placeholder ?? "" : "");
    ops.setAttr("[data-input]", "disabled", disabled ? "disabled" : "");
    ops.setAttr("[data-input]", "readonly", readonly ? "readonly" : "");
    ops.setAttr("[data-input]", "value", b.query ?? "");
    ops.replaceChildren("[data-chips]", chipsHtml(b));
    ops.setAttr("[data-chips]", "hidden", (b.chips ?? []).length > 0 ? "" : "hidden");
    ops.setAttr("[data-clear]", "hidden", b.showClear === true ? "" : "hidden");
    ops.setAttr("[data-toggle]", "disabled", disabled || readonly ? "disabled" : "");
    ops.setAttr("[data-toggle]", "aria-label", open ? "Hide options" : "Show options");
    ops.setText("[data-description]", description);
    ops.setAttr("[data-description]", "id", b.descriptionId ?? "");
    ops.setAttr("[data-description]", "hidden", description.length > 0 ? "" : "hidden");
    ops.setText("[data-error]", error);
    ops.setAttr("[data-error]", "id", b.errorId ?? "");
    ops.setAttr("[data-error]", "hidden", invalid && error.length > 0 ? "" : "hidden");
    ops.setAttr("[data-list]", "id", listId);
    ops.setAttr("[data-list]", "aria-multiselectable", b.multiple === true ? "true" : "");
    ops.setAttr("[data-list]", "aria-label", label.length > 0 ? label : b.ariaLabel ?? "Options");
    ops.replaceChildren("[data-list]", optionsHtml(b));
    ops.setText("[data-empty]", b.emptyText ?? "No matches");
    ops.setAttr("[data-empty]", "hidden", open && options.length === 0 ? "" : "hidden");
  }
  hooks.fragment.mount("combobox", (bindings, ops) => {
    paint(bindings, ops);
  });
  hooks.fragment.update("combobox", (bindings, ops) => {
    paint(bindings, ops);
  });
  xript.exports.register("inputKeydown", (payload, context) => {
    const e = payload;
    const ctx = context ?? {};
    const open = ctx.open === true;
    const values = ctx.values ?? [];
    const active = ctx.activeValue ?? "";
    const query = ctx.query ?? "";
    const move = (key) => {
      const navItems = values.map((value) => ({ key: value }));
      const target = linearNav(navItems, active, key, { orientation: "vertical", wrap: true, homeEnd: true }).focus;
      return target !== void 0 ? { focusValue: target, preventDefault: true } : { preventDefault: true };
    };
    switch (e.key) {
      case "ArrowDown":
        return open ? move("ArrowDown") : { openMenu: "first", preventDefault: true };
      case "ArrowUp":
        return open ? move("ArrowUp") : { openMenu: "last", preventDefault: true };
      case "Home":
        return open && values.length > 0 ? move("Home") : {};
      case "End":
        return open && values.length > 0 ? move("End") : {};
      case "Enter":
        if (!open && !(ctx.allowCustom === true && query.trim().length > 0)) return {};
        return { commitValue: true, preventDefault: true };
      case "Escape":
        if (open) return { closeMenu: true, preventDefault: true, stopPropagation: true };
        return query.length > 0 ? { reset: true, preventDefault: true, stopPropagation: true } : {};
      case "Tab": {
        if (!open) return {};
        const hasCommit = active.length > 0 || ctx.allowCustom === true && query.trim().length > 0;
        return hasCommit ? { commitValue: true, closeMenu: true } : { closeMenu: true };
      }
      case "Backspace":
        return ctx.multiple === true && query.length === 0 && (ctx.selectedCount ?? 0) > 0 ? { removeLast: true } : {};
      default:
        return {};
    }
  });
  xript.exports.register("inputChanged", (payload) => {
    const e = payload;
    return { inputValue: e.value ?? "" };
  });
  xript.exports.register("optionClick", (payload) => {
    const e = payload;
    const value = e.dataset?.value;
    if (value === void 0) return {};
    return { activateValue: value, activateLabel: e.dataset?.label, stopPropagation: true };
  });
  xript.exports.register("toggleClick", (payload) => {
    const e = payload;
    if (e.disabled) return {};
    return { toggleOpen: true, focusInput: true, preventDefault: true, stopPropagation: true };
  });
  xript.exports.register("clearClick", (payload) => {
    const e = payload;
    if (e.disabled) return {};
    return { clearValue: true, focusInput: true, preventDefault: true, stopPropagation: true };
  });
  xript.exports.register("chipRemove", (payload) => {
    const e = payload;
    const value = e.dataset?.value;
    if (value === void 0) return {};
    return { removeValue: value, focusInput: true, preventDefault: true, stopPropagation: true };
  });
  xript.exports.register("controlClick", () => {
    return { expand: true, focusInput: true };
  });
})();

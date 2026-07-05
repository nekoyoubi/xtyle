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
  function escapeHtml(value) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function escapeAttr(value) {
    return escapeHtml(value).replace(/"/g, "&quot;");
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
      const named = seg.slot ? ` aria-label="${escapeAttr(seg.label)}" title="${escapeAttr(seg.label)}"` : "";
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
    const groupName = labelledby ? ` aria-labelledby="${labelledby}"` : labelText ? ` aria-labelledby="${labelId}"` : ariaLabel ? ` aria-label="${escapeAttr(ariaLabel)}"` : "";
    const label = labelText ? `<span class="xtyle-segmented__label" part="label" id="${labelId}">${labelText}</span>` : "";
    return `${label}<div class="${rootClass(bindings)}" part="segmented" role="radiogroup"${groupName}>${options(bindings, selected)}</div>`;
  }
  hooks.fragment.mount("segmented", (bindings, ops) => {
    const selected = selectedValue(bindings);
    ops.replaceChildren("[data-field]", fieldInner(bindings, selected));
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
    const key = e.key ?? "";
    const current = e.dataset?.value ?? "";
    const enabled = ctx.enabledKeys;
    const here = enabled.indexOf(current);
    let target;
    if (key === "ArrowRight" || key === "ArrowDown") target = enabled[(here + 1) % enabled.length];
    else if (key === "ArrowLeft" || key === "ArrowUp") target = enabled[(here - 1 + enabled.length) % enabled.length];
    else if (key === "Home") target = enabled[0];
    else if (key === "End") target = enabled[enabled.length - 1];
    else return {};
    if (target === void 0) return {};
    return { select: target, focus: target, preventDefault: true };
  });
})();

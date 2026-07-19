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

  // packages/xtyle/src/elements/fragments/checkbox/mod.ts
  var INDICATOR = `<span class="xtyle-checkbox__indicator" part="indicator" aria-hidden="true"><svg viewBox="0 0 16 16" width="16" height="16"><path class="xtyle-checkbox__check" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m4 8 3 3 5-6" /><path class="xtyle-checkbox__dash" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M4 8h8" /></svg></span>`;
  function checkboxClass(b) {
    const size = b.size ?? "md";
    const tone = b.tone ?? "accent";
    return [
      "xtyle-checkbox",
      `xtyle-checkbox--${tone}`,
      size !== "md" && `xtyle-checkbox--${size}`,
      b.indeterminate && "xtyle-checkbox--indeterminate"
    ].filter(Boolean).join(" ");
  }
  function inner(b) {
    const label = b.label ?? null;
    const labelledby = b.labelledby ?? null;
    const checkedAttr = b.checked ? " checked" : "";
    const disabledAttr = b.disabled ? " disabled" : "";
    const ariaLabel = label && !labelledby ? ` aria-label="${escapeAttr(label)}"` : "";
    const ariaLabelledby = labelledby ? ` aria-labelledby="${escapeAttr(labelledby)}"` : "";
    const box = `<span class="xtyle-checkbox__box" part="box"><input part="control" class="xtyle-checkbox__control" type="checkbox"${checkedAttr}${disabledAttr}${ariaLabel}${ariaLabelledby} />` + INDICATOR + `</span>`;
    const labelPart = `<span class="xtyle-checkbox__label" part="label"><slot></slot></span>`;
    return box + labelPart;
  }
  hooks.fragment.mount("checkbox", (bindings, ops) => {
    ops.setAttr(".xtyle-checkbox", "class", checkboxClass(bindings));
    ops.replaceChildren("[data-checkbox]", inner(bindings));
  });
  hooks.fragment.update("checkbox", (bindings, ops) => {
    ops.setAttr(".xtyle-checkbox", "class", checkboxClass(bindings));
  });
  xript.exports.register("toggle", (payload) => {
    const e = payload;
    if (e.disabled) return {};
    return { setChecked: e.checked === true };
  });
})();

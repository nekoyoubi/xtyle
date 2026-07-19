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

  // packages/xtyle/src/elements/fragments/textarea/mod.ts
  var RESIZE_CLASS = {
    none: "xtyle-textarea--resize-none",
    horizontal: "xtyle-textarea--resize-horizontal",
    both: "xtyle-textarea--resize-both"
  };
  function rootClass(b) {
    const size = b.size ?? "md";
    const resize = b.resize ?? "vertical";
    return [
      "xtyle-textarea",
      b.invalid && "xtyle-textarea--invalid",
      b.mono && "xtyle-textarea--mono",
      size === "sm" && "xtyle-textarea--sm",
      size === "lg" && "xtyle-textarea--lg",
      RESIZE_CLASS[resize]
    ].filter(Boolean).join(" ");
  }
  function inner(b) {
    const fieldId = b.fieldId ?? "xtyle-textarea";
    const errorId = b.errorId ?? `${fieldId}-error`;
    const labelText = b.label ?? "";
    const errorText = b.error ?? "";
    const labelHidden = labelText.length === 0 ? " hidden" : "";
    const errorHidden = errorText.length === 0 ? " hidden" : "";
    const ariaInvalid = b.invalid ? "true" : "false";
    const describedBy = errorText.length > 0 ? ` aria-describedby="${escapeAttr(errorId)}"` : "";
    return `<label class="xtyle-textarea__label" part="label" for="${escapeAttr(fieldId)}" data-label${labelHidden}>${escapeHtml(labelText)}</label><textarea class="xtyle-control xtyle-textarea__control" part="textarea control" id="${escapeAttr(fieldId)}" data-field aria-invalid="${ariaInvalid}"${describedBy}></textarea><span class="xtyle-textarea__error" part="error" id="${escapeAttr(errorId)}" data-error${errorHidden}>${escapeHtml(errorText)}</span>`;
  }
  hooks.fragment.mount("textarea", (bindings, ops) => {
    ops.setAttr(".xtyle-textarea", "class", rootClass(bindings));
    ops.replaceChildren("[data-textarea]", inner(bindings));
  });
  hooks.fragment.update("textarea", (bindings, ops) => {
    ops.setAttr(".xtyle-textarea", "class", rootClass(bindings));
    ops.setAttr("[data-field]", "aria-invalid", String(bindings.invalid ?? false));
    const labelText = bindings.label ?? "";
    ops.setText("[data-label]", labelText);
    ops.toggle("[data-label]", labelText.length > 0);
    const errorText = bindings.error ?? "";
    ops.setText("[data-error]", errorText);
    ops.toggle("[data-error]", errorText.length > 0);
    const errorId = bindings.errorId ?? `${bindings.fieldId ?? "xtyle-textarea"}-error`;
    ops.setAttr("[data-field]", "aria-describedby", errorText.length > 0 ? errorId : "");
  });
  xript.exports.register("onInput", (payload) => {
    const e = payload;
    return { value: e.value ?? "" };
  });
  xript.exports.register("onChange", (payload) => {
    const e = payload;
    return { value: e.value ?? "", commitValue: true, emit: { type: "change" } };
  });
})();

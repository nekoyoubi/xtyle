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

  // packages/xtyle/src/elements/fragments/form-group/mod.ts
  function groupClass(b) {
    const size = b.size ?? "md";
    return ["xtyle-form-group", b.invalid && "xtyle-form-group--invalid", size !== "md" && `xtyle-form-group--${size}`].filter(Boolean).join(" ");
  }
  function inner(b) {
    const label = b.label ?? "";
    const description = b.description ?? "";
    const error = b.error ?? "";
    const invalid = b.invalid === true;
    const required = b.required === true;
    const labelFor = b.hasFor ? ` for="${escapeAttr(b.controlTarget ?? "")}"` : "";
    const labelHidden = label.length === 0 ? " hidden" : "";
    const requiredHidden = required ? "" : " hidden";
    const descriptionHidden = description.length === 0 ? " hidden" : "";
    const errorHidden = !invalid || error.length === 0 ? " hidden" : "";
    return `<label class="xtyle-form-group__label" part="label" data-label id="${escapeAttr(b.labelId ?? "")}"${labelFor}${labelHidden}><span data-label-text>${escapeHtml(label)}</span><span class="xtyle-form-group__required" part="required-indicator" data-required aria-hidden="true"${requiredHidden}>*</span></label><span class="xtyle-form-group__description" part="description" data-description id="${escapeAttr(b.descriptionId ?? "")}"${descriptionHidden}>${escapeHtml(description)}</span><div class="xtyle-form-group__control" part="control"><slot></slot></div><span class="xtyle-form-group__error" part="error" data-error id="${escapeAttr(b.errorId ?? "")}" role="alert"${errorHidden}>${escapeHtml(error)}</span>`;
  }
  hooks.fragment.mount("form-group", (bindings, ops) => {
    ops.setAttr(".xtyle-form-group", "class", groupClass(bindings));
    ops.replaceChildren("[data-group]", inner(bindings));
  });
  hooks.fragment.update("form-group", (bindings, ops) => {
    const label = bindings.label ?? "";
    const description = bindings.description ?? "";
    const error = bindings.error ?? "";
    const invalid = bindings.invalid === true;
    const required = bindings.required === true;
    ops.setAttr(".xtyle-form-group", "class", groupClass(bindings));
    ops.setText("[data-label-text]", label);
    ops.toggle("[data-label]", label.length > 0);
    ops.toggle("[data-required]", required);
    if (bindings.hasFor) ops.setAttr("[data-label]", "for", bindings.controlTarget ?? "");
    ops.setText("[data-description]", description);
    ops.toggle("[data-description]", description.length > 0);
    ops.setText("[data-error]", error);
    ops.toggle("[data-error]", invalid && error.length > 0);
  });
})();

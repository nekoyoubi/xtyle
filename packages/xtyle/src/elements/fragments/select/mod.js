"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/select/mod.ts
  function selectClass(b) {
    const size = b.size ?? "md";
    return [
      "xtyle-select",
      size === "sm" && "xtyle-select--sm",
      size === "lg" && "xtyle-select--lg",
      b.invalid && "xtyle-select--invalid"
    ].filter(Boolean).join(" ");
  }
  function labelText(b) {
    return b.label ?? "";
  }
  function errorText(b) {
    return b.error ?? "";
  }
  hooks.fragment.mount("select", (bindings, ops) => {
    const fieldId = bindings.fieldId ?? "xtyle-select";
    const errorId = bindings.errorId ?? `${fieldId}-error`;
    const label = labelText(bindings);
    const error = errorText(bindings);
    const invalid = bindings.invalid === true;
    ops.setAttr("[data-root]", "class", selectClass(bindings));
    ops.setAttr("[data-label]", "for", fieldId);
    ops.setText("[data-label]", label);
    if (label.length === 0) ops.setAttr("[data-label]", "hidden", "hidden");
    ops.setAttr("[data-field]", "id", fieldId);
    if (bindings.name != null) ops.setAttr("[data-field]", "name", bindings.name);
    if (bindings.disabled) ops.setAttr("[data-field]", "disabled", "disabled");
    if (bindings.required) {
      ops.setAttr("[data-field]", "required", "required");
      ops.setAttr("[data-field]", "aria-required", "true");
    }
    ops.setAttr("[data-field]", "aria-invalid", String(invalid));
    if (bindings.value != null) ops.setAttr("[data-field]", "value", bindings.value);
    if (invalid && error.length > 0) ops.setAttr("[data-field]", "aria-describedby", errorId);
    ops.replaceChildren("[data-field]", bindings.optionsHtml ?? "");
    ops.setAttr("[data-error]", "id", errorId);
    ops.setText("[data-error]", error);
    if (error.length === 0) ops.setAttr("[data-error]", "hidden", "hidden");
  });
  hooks.fragment.update("select", (bindings, ops) => {
    const label = labelText(bindings);
    const error = errorText(bindings);
    const invalid = bindings.invalid === true;
    ops.setAttr("[data-root]", "class", selectClass(bindings));
    ops.setText("[data-label]", label);
    ops.toggle("[data-label]", label.length > 0);
    ops.setAttr("[data-field]", "aria-invalid", String(invalid));
    const fieldId = bindings.fieldId ?? "xtyle-select";
    const errorId = bindings.errorId ?? `${fieldId}-error`;
    ops.setAttr("[data-field]", "aria-describedby", invalid && error.length > 0 ? errorId : "");
    ops.setText("[data-error]", error);
    ops.toggle("[data-error]", error.length > 0);
  });
})();

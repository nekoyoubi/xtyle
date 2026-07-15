"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/field/mod.ts
  function escapeHtml(value) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function escapeAttr(value) {
    return escapeHtml(value).replace(/"/g, "&quot;");
  }
  function fieldClass(b) {
    const size = b.size ?? "md";
    return [
      "xtyle-field",
      b.invalid && "xtyle-field--invalid",
      b.disabled && "xtyle-field--disabled",
      b.readonly && "xtyle-field--readonly",
      b.mono && "xtyle-field--mono",
      size !== "md" && `xtyle-field--${size}`
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
  function isInteractive(b) {
    return !(b.disabled === true) && !(b.readonly === true);
  }
  function showClear(b) {
    return b.clearable === true && isInteractive(b) && (b.value ?? "").length > 0;
  }
  function showReveal(b) {
    return (b.type ?? "text") === "password" && isInteractive(b);
  }
  function inner(b) {
    const label = b.label ?? "";
    const placeholder = b.placeholder ?? "";
    const type = b.type ?? "text";
    const value = b.value;
    const name = b.name;
    const disabled = b.disabled === true;
    const readonly = b.readonly === true;
    const invalid = b.invalid === true;
    const required = b.required === true;
    const description = b.description ?? "";
    const error = b.error ?? "";
    const inputId = b.inputId ?? "xtyle-field";
    const descriptionId = b.descriptionId ?? `${inputId}-desc`;
    const errorId = b.errorId ?? `${inputId}-error`;
    const clearShown = showClear(b);
    const revealShown = showReveal(b);
    const describes = describedBy(b);
    const fallbackAriaLabel = label.length === 0 && !b.ariaLabel;
    const inputAttrs = [
      `class="xtyle-control xtyle-field__input"`,
      `part="input"`,
      `id="${escapeAttr(inputId)}"`,
      `placeholder="${escapeAttr(placeholder)}"`,
      `type="${escapeAttr(type)}"`,
      disabled ? "disabled" : null,
      readonly ? "readonly" : null,
      name != null ? `name="${escapeAttr(name)}"` : null,
      value != null ? `value="${escapeAttr(value)}"` : null,
      `aria-invalid="${invalid}"`,
      fallbackAriaLabel ? `aria-label="${escapeAttr(placeholder)}"` : null,
      required ? "required" : null,
      required ? `aria-required="true"` : null,
      describes.length > 0 ? `aria-describedby="${escapeAttr(describes)}"` : null
    ].filter(Boolean).join(" ");
    const star = required ? `<span class="xtyle-field__required" part="required" aria-hidden="true">*</span>` : "";
    const labelHidden = label.length === 0 ? " hidden" : "";
    const revealHidden = revealShown ? "" : " hidden";
    const typeIsText = type === "text";
    const revealPressed = String(typeIsText);
    const revealLabel = typeIsText ? "Hide value" : "Show value";
    const clearHidden = clearShown ? "" : " hidden";
    const descriptionHidden = description.length === 0 ? " hidden" : "";
    const errorHidden = !invalid || error.length === 0 ? " hidden" : "";
    return `<label class="xtyle-field__label" part="label" for="${escapeAttr(inputId)}"${labelHidden}>${escapeHtml(label)}${star}</label><div class="xtyle-field__control" part="control"><span class="xtyle-field__adornment" part="adornment"><slot name="prefix"></slot></span><input ${inputAttrs} /><button type="button" class="xtyle-field__action" part="action-reveal" data-action="reveal"${revealHidden} aria-pressed="${revealPressed}" aria-label="${escapeAttr(revealLabel)}"><slot name="reveal-icon"><span aria-hidden="true">&#128065;</span></slot></button><button type="button" class="xtyle-field__action" part="action-clear" data-action="clear"${clearHidden} aria-label="Clear"><slot name="clear-icon"><span aria-hidden="true">&times;</span></slot></button><span class="xtyle-field__adornment" part="adornment"><slot name="suffix"></slot></span></div><span class="xtyle-field__description" part="description" id="${escapeAttr(descriptionId)}"${descriptionHidden}>${escapeHtml(description)}</span><span class="xtyle-field__error" part="error" id="${escapeAttr(errorId)}"${errorHidden}>${escapeHtml(error)}</span>`;
  }
  hooks.fragment.mount("field", (bindings, ops) => {
    ops.setAttr(".xtyle-field", "class", fieldClass(bindings));
    ops.replaceChildren("[data-field]", inner(bindings));
  });
  hooks.fragment.update("field", (bindings, ops) => {
    ops.setAttr(".xtyle-field", "class", fieldClass(bindings));
    const labelText = bindings.label ?? "";
    const star = bindings.required ? `<span class="xtyle-field__required" part="required" aria-hidden="true">*</span>` : "";
    ops.replaceChildren(".xtyle-field__label", `${escapeHtml(labelText)}${star}`);
    ops.toggle(".xtyle-field__label", labelText.length === 0 ? false : true);
    ops.setAttr(".xtyle-field__input", "aria-invalid", String(bindings.invalid === true));
    const descText = bindings.description ?? "";
    ops.setText(".xtyle-field__description", descText);
    ops.toggle(".xtyle-field__description", descText.length > 0);
    const errorText = bindings.error ?? "";
    ops.setText(".xtyle-field__error", errorText);
    ops.toggle(".xtyle-field__error", bindings.invalid === true && errorText.length > 0);
    ops.toggle('[data-action="clear"]', showClear(bindings));
    ops.toggle('[data-action="reveal"]', showReveal(bindings));
  });
  xript.exports.register("onInput", (payload) => {
    const e = payload;
    return { inputValue: e.value ?? "", emit: { type: "input" } };
  });
  xript.exports.register("onChange", () => {
    return { emit: { type: "change" } };
  });
  xript.exports.register("clear", (payload) => {
    const e = payload;
    if (e.disabled) return {};
    return { clearValue: true, focusInput: true, emit: { type: "input" } };
  });
  xript.exports.register("reveal", () => {
    return { toggleReveal: true };
  });
})();

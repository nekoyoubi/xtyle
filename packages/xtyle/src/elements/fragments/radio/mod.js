"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/radio/mod.ts
  function escapeHtml(value) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function escapeAttr(value) {
    return escapeHtml(value).replace(/"/g, "&quot;");
  }
  function radioClass(b) {
    const tone = b.tone ?? "accent";
    const size = b.size ?? "md";
    return [
      "xtyle-radio",
      `xtyle-radio--${tone}`,
      size !== "md" && `xtyle-radio--${size}`,
      b.invalid && "xtyle-radio--invalid",
      b.card && "xtyle-radio--card"
    ].filter(Boolean).join(" ");
  }
  function inner(b) {
    const name = b.name ?? null;
    const value = b.value ?? "on";
    const label = b.label ?? null;
    const labelledby = b.labelledby ?? null;
    const description = b.description ?? "";
    const descriptionId = b.descriptionId ?? "xtyle-radio-desc";
    const nameAttr = name !== null ? ` name="${name}"` : "";
    const valueAttr = ` value="${value}"`;
    const checkedAttr = b.checked ? " checked" : "";
    const disabledAttr = b.disabled ? " disabled" : "";
    const ariaInvalid = b.invalid ? ` aria-invalid="true"` : "";
    const ariaLabel = label && !labelledby ? ` aria-label="${label}"` : "";
    const ariaLabelledby = labelledby ? ` aria-labelledby="${labelledby}"` : "";
    const describedby = description.length > 0 ? ` aria-describedby="${escapeAttr(descriptionId)}"` : "";
    const descriptionHidden = description.length === 0 ? " hidden" : "";
    const labelText = label !== null ? label : "";
    return `<input part="control" class="xtyle-radio__control" type="radio"${nameAttr}${valueAttr}${checkedAttr}${disabledAttr}${ariaInvalid}${ariaLabel}${ariaLabelledby}${describedby} /><span part="indicator" class="xtyle-radio__indicator" aria-hidden="true"></span><span class="xtyle-radio__text"><span part="label" class="xtyle-radio__label"><slot>${labelText}</slot></span><span part="description" class="xtyle-radio__description" id="${escapeAttr(descriptionId)}"${descriptionHidden}>${escapeHtml(description)}</span></span>`;
  }
  hooks.fragment.mount("radio", (bindings, ops) => {
    ops.setAttr("[data-root]", "class", radioClass(bindings));
    ops.replaceChildren("[data-radio]", inner(bindings));
  });
  hooks.fragment.update("radio", (bindings, ops) => {
    ops.setAttr("[data-root]", "class", radioClass(bindings));
    ops.setAttr(".xtyle-radio__control", "value", bindings.value ?? "on");
  });
  xript.exports.register("select", (payload) => {
    const e = payload;
    if (e.disabled || e.ariaDisabled === "true") return {};
    if (e.checked === false) return {};
    return { selectRadio: true };
  });
})();

"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/radio/mod.ts
  function radioClass(b) {
    const tone = b.tone ?? "accent";
    const size = b.size ?? "md";
    return [
      "xtyle-radio",
      `xtyle-radio--${tone}`,
      size !== "md" && `xtyle-radio--${size}`,
      b.invalid && "xtyle-radio--invalid"
    ].filter(Boolean).join(" ");
  }
  function inner(b) {
    const name = b.name ?? null;
    const value = b.value ?? "on";
    const label = b.label ?? null;
    const labelledby = b.labelledby ?? null;
    const nameAttr = name !== null ? ` name="${name}"` : "";
    const valueAttr = ` value="${value}"`;
    const checkedAttr = b.checked ? " checked" : "";
    const disabledAttr = b.disabled ? " disabled" : "";
    const ariaInvalid = b.invalid ? ` aria-invalid="true"` : "";
    const ariaLabel = label && !labelledby ? ` aria-label="${label}"` : "";
    const ariaLabelledby = labelledby ? ` aria-labelledby="${labelledby}"` : "";
    const labelText = label !== null ? label : "";
    return `<input part="control" class="xtyle-radio__control" type="radio"${nameAttr}${valueAttr}${checkedAttr}${disabledAttr}${ariaInvalid}${ariaLabel}${ariaLabelledby} /><span part="indicator" class="xtyle-radio__indicator" aria-hidden="true"></span><span part="label" class="xtyle-radio__label"><slot>${labelText}</slot></span>`;
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

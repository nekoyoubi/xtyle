"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/tooltip/mod.ts
  function tooltipClass(b) {
    const cls = ["xtyle-tooltip", `xtyle-tooltip--${b.placement ?? "top"}`];
    if (b.tone) cls.push(`xtyle-tooltip--${b.tone}`);
    if (b.variant === "soft" || b.variant === "solid") cls.push(`xtyle-tooltip--${b.variant}`);
    if (b.mode === "rich") cls.push("xtyle-tooltip--rich");
    if (b.size === "md") cls.push("xtyle-tooltip--md");
    return cls.join(" ");
  }
  function textValue(b) {
    return b.text ?? "";
  }
  hooks.fragment.mount("tooltip", (bindings, ops) => {
    ops.setAttr(".xtyle-tooltip", "class", tooltipClass(bindings));
    ops.setAttr("[data-content]", "id", bindings.contentId ?? "");
    ops.setAttr("[data-content]", "data-open", String(bindings.open ?? false));
    ops.setText("[data-label]", textValue(bindings));
  });
  hooks.fragment.update("tooltip", (bindings, ops) => {
    ops.setAttr(".xtyle-tooltip", "class", tooltipClass(bindings));
    ops.setAttr("[data-content]", "data-open", String(bindings.open ?? false));
    ops.setText("[data-label]", textValue(bindings));
  });
})();

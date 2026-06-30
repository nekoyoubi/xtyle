"use strict";
(() => {
  // packages/xoji/src/elements/fragments/tooltip/mod.ts
  function tooltipClass(b) {
    const cls = ["xoji-tooltip", `xoji-tooltip--${b.placement ?? "top"}`];
    if (b.tone) cls.push(`xoji-tooltip--${b.tone}`);
    if (b.variant === "soft" || b.variant === "solid") cls.push(`xoji-tooltip--${b.variant}`);
    if (b.mode === "rich") cls.push("xoji-tooltip--rich");
    if (b.size === "md") cls.push("xoji-tooltip--md");
    return cls.join(" ");
  }
  function textValue(b) {
    return b.text ?? "";
  }
  hooks.fragment.mount("tooltip", (bindings, ops) => {
    ops.setAttr("[data-root]", "class", tooltipClass(bindings));
    ops.setAttr("[data-content]", "id", bindings.contentId ?? "");
    ops.setAttr("[data-content]", "data-open", String(bindings.open ?? false));
    ops.setText("[data-text]", textValue(bindings));
  });
  hooks.fragment.update("tooltip", (bindings, ops) => {
    ops.setAttr("[data-root]", "class", tooltipClass(bindings));
    ops.setAttr("[data-content]", "data-open", String(bindings.open ?? false));
    ops.setText("[data-text]", textValue(bindings));
  });
})();

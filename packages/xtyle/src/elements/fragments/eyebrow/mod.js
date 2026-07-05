"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/eyebrow/mod.ts
  function eyebrowClass(b) {
    const tone = b.tone ?? "accent";
    const tracking = b.tracking ?? "normal";
    return ["xtyle-eyebrow", tone !== "accent" && `xtyle-eyebrow--${tone}`, tracking === "wide" && "xtyle-eyebrow--wide"].filter(Boolean).join(" ");
  }
  function eyebrowHtml(b) {
    const as = b.as ?? "p";
    const tag = as === "span" ? "span" : as === "div" ? "div" : "p";
    return `<${tag} part="eyebrow" class="${eyebrowClass(b)}"><slot></slot></${tag}>`;
  }
  hooks.fragment.mount("eyebrow", (bindings, ops) => {
    ops.replaceChildren("[data-eyebrow]", eyebrowHtml(bindings));
  });
  hooks.fragment.update("eyebrow", (bindings, ops) => {
    ops.setAttr('[part="eyebrow"]', "class", eyebrowClass(bindings));
  });
})();

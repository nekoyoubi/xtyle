"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/text/mod.ts
  function textClass(b) {
    const size = b.size ?? "body";
    const weight = b.weight ?? "normal";
    const leading = b.leading ?? "snug";
    const tone = b.tone ?? "default";
    return [
      "xtyle-text",
      size !== "body" && `xtyle-text--${size}`,
      weight !== "normal" && `xtyle-text--${weight}`,
      leading !== "snug" && `xtyle-text--${leading}`,
      tone !== "default" && `xtyle-text--${tone}`,
      b.mono && "xtyle-text--mono"
    ].filter(Boolean).join(" ");
  }
  function textHtml(b) {
    const tag = b.as === "span" ? "span" : "p";
    return `<${tag} part="text" class="${textClass(b)}"><slot></slot></${tag}>`;
  }
  hooks.fragment.mount("text", (bindings, ops) => {
    ops.replaceChildren("[data-text]", textHtml(bindings));
  });
  hooks.fragment.update("text", (bindings, ops) => {
    ops.setAttr('[part="text"]', "class", textClass(bindings));
  });
})();

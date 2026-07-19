"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/heading/mod.ts
  function headingClass(b) {
    const size = b.size ?? "body";
    const tone = b.tone ?? "default";
    return [
      "xtyle-heading",
      size !== "body" && `xtyle-heading--${size}`,
      tone !== "default" && `xtyle-heading--${tone}`
    ].filter(Boolean).join(" ");
  }
  function headingHtml(b) {
    const raw = b.level ?? 2;
    const level = raw >= 1 && raw <= 6 ? raw : 2;
    const tag = `h${level}`;
    return `<${tag} part="heading" class="${headingClass(b)}"><slot></slot></${tag}>`;
  }
  hooks.fragment.mount("heading", (bindings, ops) => {
    ops.replaceChildren("[data-heading]", headingHtml(bindings));
  });
  hooks.fragment.update("heading", (bindings, ops) => {
    ops.setAttr(".xtyle-heading", "class", headingClass(bindings));
  });
})();

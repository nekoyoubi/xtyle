"use strict";
(() => {
  // packages/xoji/src/elements/fragments/kbd/mod.ts
  function kbdClass(b) {
    const size = b.size ?? "md";
    const tone = b.tone ?? "";
    return ["xoji-kbd", size !== "md" && `xoji-kbd--${size}`, tone && `xoji-kbd--${tone}`].filter(Boolean).join(" ");
  }
  function kbdHtml(b) {
    return `<kbd part="kbd" class="${kbdClass(b)}"><slot></slot></kbd>`;
  }
  hooks.fragment.mount("kbd", (bindings, ops) => {
    ops.replaceChildren("[data-kbd]", kbdHtml(bindings));
  });
  hooks.fragment.update("kbd", (bindings, ops) => {
    ops.setAttr('[part="kbd"]', "class", kbdClass(bindings));
  });
})();

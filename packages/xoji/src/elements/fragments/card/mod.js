"use strict";
(() => {
  // packages/xoji/src/elements/fragments/card/mod.ts
  function cardClass(b) {
    return [
      "xoji-card",
      b.overlay && "xoji-card--overlay",
      (b.interactive || b.action) && "xoji-card--interactive",
      b.action && "xoji-card--action",
      b.compact && "xoji-card--compact",
      b.tone && `xoji-card--${b.tone}`,
      b.tone && "xoji-card--toned"
    ].filter(Boolean).join(" ");
  }
  function cardHtml(b) {
    return `<div part="card" class="${cardClass(b)}"><div class="xoji-card__header" part="header"><slot name="header"></slot></div><div class="xoji-card__body" part="body"><slot></slot></div><div class="xoji-card__footer" part="footer"><slot name="footer"></slot></div></div>`;
  }
  hooks.fragment.mount("card", (bindings, ops) => {
    ops.replaceChildren("[data-card]", cardHtml(bindings));
  });
  hooks.fragment.update("card", (bindings, ops) => {
    ops.setAttr('[part="card"]', "class", cardClass(bindings));
  });
})();
